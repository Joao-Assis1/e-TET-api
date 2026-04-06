import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  SyncBatchPayloadDto,
  SyncHouseholdDataDto,
  SyncFamilyDataDto,
  SyncIndividualDataDto,
  SyncVisitDataDto,
} from './sync.dto';
import { EsusThriftService } from './esus-thrift.service';
import { Household } from '../households/household.entity';
import { Family } from '../families/family.entity';
import { Individual, JobStatus } from '../individuals/individual.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { Visit } from '../visits/visit.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly esusThriftService: EsusThriftService,
  ) {}

  async getInitialSyncData(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) throw new InternalServerErrorException('Usuário não encontrado.');

    const households = await this.dataSource.manager.find(Household, {
      where: { createdBy: { id: userId } },
    });

    const householdIds = households.map((h) => h.id);
    let families: Family[] = [];
    let individuals: Individual[] = [];
    let visits: Visit[] = [];

    if (householdIds.length > 0) {
      families = await this.dataSource.manager
        .createQueryBuilder(Family, 'family')
        .where('family.household_id IN (:...ids)', { ids: householdIds })
        .getMany();

      const familyIds = families.map((f) => f.id);
      if (familyIds.length > 0) {
        individuals = await this.dataSource.manager
          .createQueryBuilder(Individual, 'individual')
          .leftJoinAndSelect('individual.healthConditions', 'hc')
          .where('individual.family_id IN (:...ids)', { ids: familyIds })
          .getMany();
      }

      visits = await this.dataSource.manager
        .createQueryBuilder(Visit, 'visit')
        .where('visit.household_id IN (:...ids)', { ids: householdIds })
        .getMany();
    }

    return {
      sucesso: true,
      message: 'Dados iniciais carregados para o tablet',
      data: {
        households,
        families,
        individuals,
        visits,
      },
    };
  }

  async processBatchSync(payload: SyncBatchPayloadDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const inconsistencies: any = { households: [], families: [], individuals: [], visits: [] };
    const savedIds: any = { households: [], families: [], individuals: [], visits: [] };
    const failedIds = { households: new Set<string>(), families: new Set<string>() };

    try {
      const { households = [], families = [], individuals = [], visits = [] } = payload;
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });

      // 1. Households
      for (const h of households) {
        const dto = plainToInstance(SyncHouseholdDataDto, h);
        const errors = await validate(dto);
        if (errors.length > 0) { inconsistencies.households.push({ id: h.id, erro: 'Erro validação' }); if (h.id) failedIds.households.add(h.id); continue; }

        try {
          const { id, ...data } = h;
          let hdEntity = id ? await queryRunner.manager.findOne(Household, { where: { id } }) : null;
          const baseData: any = { ...data, id: id || undefined, createdBy: user || undefined };
          
          if (hdEntity) {
            hdEntity = queryRunner.manager.merge(Household, hdEntity, baseData);
          } else {
            hdEntity = queryRunner.manager.create(Household, baseData);
          }
          await queryRunner.manager.save(Household, hdEntity!);
          if (hdEntity!.id) savedIds.households.push(hdEntity!.id);
        } catch (e) { inconsistencies.households.push({ id: h.id, erro: (e as Error).message }); if (h.id) failedIds.households.add(h.id); }
      }

      const individualsByFamily = new Map<string, any[]>();
      for (const ind of individuals) { if (ind.family_id) { if (!individualsByFamily.has(ind.family_id)) { individualsByFamily.set(ind.family_id, []); } individualsByFamily.get(ind.family_id)!.push(ind); } }

      // 2. Families
      for (const f of families) {
        if (f.household_id && failedIds.households.has(f.household_id)) { inconsistencies.families.push({ id: f.id, erro: 'Cascata' }); if (f.id) failedIds.families.add(f.id); continue; }

        const dto = plainToInstance(SyncFamilyDataDto, f);
        const errors = await validate(dto);
        if (errors.length > 0) { inconsistencies.families.push({ id: f.id, erro: 'Erro' }); if (f.id) failedIds.families.add(f.id); continue; }

        const inds = (f.id ? individualsByFamily.get(f.id) : []) || [];
        let r = 0;
        for (const ind of inds) {
          const hc = ind.healthConditions || {};
          if (hc.acamado_domiciliado) r += 3;
          if (ind.possui_deficiencia) r += 3;
          if (hc.uso_alcool || hc.uso_outras_drogas || hc.fumante) r += 2;
          if (ind.situacao_mercado_trabalho === JobStatus.DESEMPREGADO) r += 2;
          if (ind.data_nascimento) {
            const birthDate = new Date(ind.data_nascimento);
            const ageMonths = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
            const ageYears = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
            if (ageMonths < 6) r += 1;
            if (ageYears > 70) r += 1;
          }
          if (hc.hipertensao_arterial) r += 1;
          if (hc.diabetes) r += 1;
        }
        if (f.saneamento_inadequado) r += 3;

        let classificacao_risco = 'Sem Risco';
        if (r >= 9) classificacao_risco = 'R3 - Risco máximo';
        else if (r >= 7) classificacao_risco = 'R2 - Risco médio';
        else if (r >= 5) classificacao_risco = 'R1 - Risco menor';

        try {
          const { id, household_id, ...data } = f;
          let fEntity = id ? await queryRunner.manager.findOne(Family, { where: { id } }) : null;
          const baseData: any = { 
            ...data, 
            id: id || undefined,
            pontuacao_risco: r, 
            classificacao_risco, 
            household: household_id ? { id: household_id } : undefined,
            reside_desde: data.reside_desde ? new Date(data.reside_desde) : undefined
          };
          if (fEntity) { fEntity = queryRunner.manager.merge(Family, fEntity, baseData); }
          else { fEntity = queryRunner.manager.create(Family, baseData); }
          await queryRunner.manager.save(Family, fEntity!);
          if (fEntity!.id) savedIds.families.push(fEntity!.id);
        } catch (e) { inconsistencies.families.push({ id: f.id, erro: (e as Error).message }); if (f.id) failedIds.families.add(f.id); }
      }

      // 3. Individuals
      for (const i of individuals) {
        if (i.family_id && failedIds.families.has(i.family_id)) { inconsistencies.individuals.push({ id: i.id, erro: 'Cascata' }); continue; }
        const dto = plainToInstance(SyncIndividualDataDto, i);
        const errors = await validate(dto);
        if (errors.length > 0) { inconsistencies.individuals.push({ id: i.id, erro: 'Erro' }); continue; }

        try {
          const { id, family_id, healthConditions, ...data } = i;
          let iEnt = id ? await queryRunner.manager.findOne(Individual, { where: { id }, relations: ['healthConditions'] }) : null;
          const base: any = { ...data, id: id || undefined, family: family_id ? { id: family_id } : undefined, data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : undefined };

          if (iEnt) {
            if (iEnt.healthConditions && healthConditions) iEnt.healthConditions = queryRunner.manager.merge(IndividualHealth, iEnt.healthConditions, healthConditions);
            else if (healthConditions) iEnt.healthConditions = queryRunner.manager.create(IndividualHealth, healthConditions);
            iEnt = queryRunner.manager.merge(Individual, iEnt, base);
          } else {
            iEnt = queryRunner.manager.create(Individual, base);
            if (healthConditions) iEnt.healthConditions = queryRunner.manager.create(IndividualHealth, healthConditions);
          }
          await queryRunner.manager.save(Individual, iEnt!);
          if (iEnt!.id) savedIds.individuals.push(iEnt!.id);
        } catch (e) { inconsistencies.individuals.push({ id: i.id, erro: (e as Error).message }); }
      }

      // 4. Visits
      for (const v of visits) {
        if (v.household_id && failedIds.households.has(v.household_id)) { inconsistencies.visits.push({ id: v.id, erro: 'Cascata' }); continue; }
        try {
          const { id, household_id, family_id, individual_id, ...data } = v;
          let vEnt = id ? await queryRunner.manager.findOne(Visit, { where: { id } }) : null;
          const base: any = { ...data, id: id || undefined, household: household_id ? { id: household_id } : undefined, family: family_id ? { id: family_id } : undefined, individual: individual_id ? { id: individual_id } : undefined, data_visita: data.data_visita ? new Date(data.data_visita) : undefined };
          if (vEnt) vEnt = queryRunner.manager.merge(Visit, vEnt, base);
          else vEnt = queryRunner.manager.create(Visit, base);
          await queryRunner.manager.save(Visit, vEnt!);
          if (vEnt!.id) savedIds.visits.push(vEnt!.id);
        } catch (e) { inconsistencies.visits.push({ id: v.id, erro: (e as Error).message }); }
      }

      await queryRunner.commitTransaction();
      return { sucesso: true, message: 'Lote processado.', salvos: savedIds, inconsistencias: inconsistencies };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`Falha: ${(error as Error).message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async exportProcessedBatchToEsus(userId: number) {
    const user = await this.dataSource.manager.findOne(User, { where: { id: userId } });
    if (!user || !user.cns_profissional || !user.cnes_estabelecimento) throw new BadRequestException('Credenciais e-SUS incompletas.');
    const individuals = await this.dataSource.manager.find(Individual, { where: { family: { household: { createdBy: { id: userId } } } }, relations: ['family', 'family.household', 'healthConditions'] });
    const results: any[] = [];
    for (const ind of individuals) { const cdsData = await this.esusThriftService.mapIndividualToCDS(ind, user); results.push(cdsData); }
    const binary = await this.esusThriftService.serializeBatchToThrift(results);
    return { success: true, filename: `CDS_LOTE_${userId}_${Date.now()}.esus`, size: binary.length, data: binary.toString('base64') };
  }
}
