import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, QueryRunner, DeepPartial, Brackets, In } from 'typeorm';

import { SyncBatchPayloadDto } from './sync.dto';
import { Household } from '../households/household.entity';
import { Family, FamilyRisk } from '../families/family.entity';
import { Individual, JobStatus } from '../individuals/individual.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { Visit } from '../visits/visit.entity';
import { User } from '../users/user.entity';
import { RiskCalculatorService } from '../families/services/risk-calculator.service';
import { CreateRiskAssessmentDto } from '../families/dto/create-risk.dto';
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';

/**
 * Serviço responsável pela sincronização de dados entre os tablets (offline) e a API central.
 * Lida com processamento em lote, transações e resiliência a dados parciais.
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly riskCalculatorService: RiskCalculatorService,
  ) {}

  /**
   * Obtém todos os dados iniciais que um usuário (Agente de Saúde) precisa para trabalhar offline.
   * Filtra os dados pela microárea do usuário para garantir segurança territorial.
   */
  async getInitialSyncData(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user)
      throw new InternalServerErrorException('Usuário não encontrado.');

    const isAcs = user.role === 'acs';
    const microarea = user.microarea;

    // 1. Buscar Todos os Domicílios Ativos
    const households = await this.dataSource.manager.find(Household);
    const householdIds = new Set(households.map((h) => h.id));

    // 2. Buscar Todas as Famílias Ativas
    const rawFamilies = await this.dataSource.manager.find(Family, {
      relations: ['household']
    });
    const familyIds = new Set(rawFamilies.map((f) => f.id));

    // 3. Buscar Todos os Indivíduos Ativos (Não arquivados)
    const individuals = await this.dataSource.manager.find(Individual, {
      where: { arquivado: false },
      relations: ['healthConditions', 'household', 'family', 'family.household']
    });

    // 4. Buscar Todas as Visitas Ativas
    const visits = await this.dataSource.manager.find(Visit, {
      relations: ['household', 'family', 'individual']
    });

    const families = await Promise.all(rawFamilies.map(async (f) => {
      const sentinels = await this.dataSource.manager.findOne(FamilyRiskStratification, {
        where: { familyId: f.id },
        order: { createdAt: 'DESC' }
      });
      return { ...f, sentinels };
    }));

    return {
      sucesso: true,
      message: 'Dados iniciais carregados para o tablet',
      data: {
        households,
        families,
        individuals,
        visits,
        healthConditions: individuals.flatMap(i => i.healthConditions ? [i.healthConditions] : [])
      },
    };
  }

  /**
   * Processa um lote de sincronização vindo do tablet.
   */
  async processBatchSync(payload: SyncBatchPayloadDto, userId: number) {
    if (!userId) {
      throw new BadRequestException('ID de usuário obrigatório para sincronização.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const inconsistencies: Record<string, any[]> = { households: [], families: [], individuals: [], visits: [] };
    const savedData: Record<string, any[]> = { households: [], families: [], individuals: [], visits: [] };
    const failedIds = { households: new Set<string>(), families: new Set<string>() };

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (!user) throw new InternalServerErrorException('Usuário logado não encontrado.');

      await this.saveHouseholds(payload.households || [], user, queryRunner, inconsistencies, savedData, failedIds);
      await this.saveFamilies(payload.families || [], payload.individuals || [], queryRunner, inconsistencies, savedData, failedIds, user);
      await this.saveIndividuals(payload.individuals || [], queryRunner, inconsistencies, savedData);
      await this.saveVisits(payload.visits || [], queryRunner, inconsistencies, savedData);

      await queryRunner.commitTransaction();

      return {
        sucesso: true,
        message: 'Lote processado.',
        households: savedData.households,
        families: savedData.families,
        individuals: savedData.individuals,
        visits: savedData.visits,
        inconsistencias: inconsistencies,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Erro crítico na sincronização: ${error.message}`);
      throw new InternalServerErrorException('Falha crítica no processamento do lote.');
    } finally {
      await queryRunner.release();
    }
  }

  private async saveHouseholds(households: any[], user: User, queryRunner: QueryRunner, inconsistencies: any, savedData: any, failedIds: any) {
    for (const h of households) {
      try {
        const { id, _tempId, ...data } = h;
        if (!data.logradouro || !data.numero) {
           inconsistencies.households.push({ id: id || _tempId, erro: 'Campos obrigatórios ausentes (logradouro/numero)' });
           continue;
        }
        let hdEntity = id ? await queryRunner.manager.findOne(Household, { where: { id }, withDeleted: true }) : null;
        const baseData: DeepPartial<Household> = { ...data, createdBy: user || undefined };
        if (hdEntity) queryRunner.manager.merge(Household, hdEntity, baseData);
        else hdEntity = queryRunner.manager.create(Household, { ...baseData, id: id || undefined } as any);
        await queryRunner.manager.save(Household, hdEntity);
        savedData.households.push({ ...hdEntity, _tempId });
      } catch (e) {
        inconsistencies.households.push({ id: h.id || h._tempId, erro: (e as Error).message });
      }
    }
  }

  private async saveFamilies(families: any[], allIndividuals: any[], queryRunner: QueryRunner, inconsistencies: any, savedData: any, failedIds: any, user: User) {
    const individualsByFamily = new Map<string, any[]>();
    for (const ind of allIndividuals) {
      if (ind.family_id) {
        const list = individualsByFamily.get(ind.family_id) || [];
        list.push(ind);
        individualsByFamily.set(ind.family_id, list);
      }
    }

    for (const f of families) {
      try {
        const { id, _tempId, household_id, sentinels, ...data } = f;
        const familyInds = (id ? individualsByFamily.get(id) : []) || [];
        
        // Prioriza sentinelas enviadas pelo frontend, caso existam (Estratificação Manual)
        // Caso contrário, tenta mapear dos indivíduos (Estratificação Automática/Legado)
        const riskPayload = sentinels || this.mapRiskPayload(f, familyInds);
        
        let classificacao_risco = 'Sem Risco';
        let pontuacao_risco = 0;

        try {
          const riskResult = this.riskCalculatorService.calculateScoreAndClass(riskPayload, f.membros_declarados || 0);
          pontuacao_risco = riskResult.finalScore;
          classificacao_risco = riskResult.riskClass;
        } catch (error) {}

        let fEntity = id ? await queryRunner.manager.findOne(Family, { where: { id }, withDeleted: true }) : null;
        const baseData: DeepPartial<Family> = { 
          ...data, 
          pontuacao_risco, 
          classificacao_risco: classificacao_risco as FamilyRisk, 
          household: household_id ? { id: household_id as any } : undefined,
          createdBy: user.id as any
        };
        
        if (fEntity) queryRunner.manager.merge(Family, fEntity, baseData);
        else fEntity = queryRunner.manager.create(Family, { ...baseData, id: id || undefined } as any);
        
        await queryRunner.manager.save(Family, fEntity);
        
        // Se houver sentinelas, salvamos o registro histórico vinculado a esta família
        if (sentinels) {
          try {
            const riskRecord = queryRunner.manager.create(FamilyRiskStratification, {
              ...sentinels,
              familyId: fEntity.id,
              finalScore: pontuacao_risco,
              riskClass: classificacao_risco,
              createdBy: String(user.id)
            });
            await queryRunner.manager.save(FamilyRiskStratification, riskRecord);
          } catch (riskError) {
            this.logger.error(`Erro ao salvar histórico de risco na sync: ${riskError.message}`);
          }
        }

        savedData.families.push({ ...fEntity, _tempId });
      } catch (e) {
        inconsistencies.families.push({ id: f.id || f._tempId, erro: (e as Error).message });
      }
    }
  }

  private async saveIndividuals(individuals: any[], queryRunner: QueryRunner, inconsistencies: any, savedData: any) {
    for (const i of individuals) {
      try {
        const { id, _tempId, family_id, healthConditions, ...data } = i;
        let iEnt = id ? await queryRunner.manager.findOne(Individual, { where: { id }, relations: ['healthConditions'], withDeleted: true }) : null;
        const base: DeepPartial<Individual> = { ...data, family: family_id ? { id: family_id as any } : undefined, data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : undefined, cpf: data.cpf && data.cpf.trim() !== '' ? data.cpf : null, cartao_sus: data.cartao_sus && data.cartao_sus.trim() !== '' ? data.cartao_sus : null };
        if (iEnt) {
          if (iEnt.healthConditions && healthConditions) queryRunner.manager.merge(IndividualHealth, iEnt.healthConditions, healthConditions);
          else if (healthConditions) iEnt.healthConditions = queryRunner.manager.create(IndividualHealth, healthConditions);
          queryRunner.manager.merge(Individual, iEnt, base);
        } else {
          iEnt = queryRunner.manager.create(Individual, { ...base, id: id || undefined } as any);
          if (healthConditions) iEnt.healthConditions = queryRunner.manager.create(IndividualHealth, healthConditions);
        }
        await queryRunner.manager.save(Individual, iEnt);
        savedData.individuals.push({ ...iEnt, _tempId });
      } catch (e) {
        inconsistencies.individuals.push({ id: i.id || i._tempId, erro: (e as Error).message });
      }
    }
  }

  private async saveVisits(visits: any[], queryRunner: QueryRunner, inconsistencies: any, savedData: any) {
    for (const v of visits) {
      try {
        const { id, _tempId, household_id, family_id, individual_id, ...data } = v;
        let vEnt = id ? await queryRunner.manager.findOne(Visit, { where: { id }, withDeleted: true }) : null;
        const base: DeepPartial<Visit> = { ...data, household: household_id ? { id: household_id as any } : undefined, family: family_id ? { id: family_id as any } : undefined, individual: individual_id ? { id: individual_id as any } : undefined, data_visita: data.data_visita ? new Date(data.data_visita) : undefined };
        if (vEnt) queryRunner.manager.merge(Visit, vEnt, base);
        else vEnt = queryRunner.manager.create(Visit, { ...base, id: id || undefined } as any);
        await queryRunner.manager.save(Visit, vEnt);
        savedData.visits.push({ ...vEnt, _tempId });
      } catch (e) {
        inconsistencies.visits.push({ id: v.id || v._tempId, erro: (e as Error).message });
      }
    }
  }

  private mapRiskPayload(f: any, members: any[]): CreateRiskAssessmentDto {
    const payload: CreateRiskAssessmentDto = {
      bedriddenCount: 0, physicalDisabilityCount: 0, mentalDisabilityCount: 0, severeMalnutritionCount: 0, drugAddictionCount: 0, unemployedCount: 0, illiterateCount: 0, under6MonthsCount: 0, over70YearsCount: 0, hypertensionCount: 0, diabetesCount: 0, basicSanitation: !f.saneamento_inadequado, roomsCount: 1,
    };
    for (const ind of members) {
      const hc = ind.healthConditions || {};
      if (hc.acamado_domiciliado) payload.bedriddenCount++;
      if (ind.possui_deficiencia) payload.physicalDisabilityCount++;
      if (hc.uso_alcool || hc.uso_outras_drogas || hc.fumante) payload.drugAddictionCount++;
      if (ind.situacao_mercado_trabalho === JobStatus.DESEMPREGADO) payload.unemployedCount++;
      if (ind.data_nascimento) {
        const birthDate = new Date(ind.data_nascimento);
        const ageYears = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
        if (ageYears > 70) payload.over70YearsCount++;
      }
      if (hc.hipertensao_arterial) payload.hypertensionCount++;
      if (hc.diabetes) payload.diabetesCount++;
    }
    return payload;
  }
}
