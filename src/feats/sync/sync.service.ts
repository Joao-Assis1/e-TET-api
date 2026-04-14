import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, QueryRunner, DeepPartial } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  SyncBatchPayloadDto,
  SyncHouseholdDataDto,
  SyncFamilyDataDto,
  SyncIndividualDataDto,
  SyncVisitDataDto,
} from './sync.dto';
import { Household } from '../households/household.entity';
import { Family, FamilyRisk } from '../families/family.entity';
import { Individual, JobStatus } from '../individuals/individual.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { Visit } from '../visits/visit.entity';
import { User } from '../users/user.entity';
import { RiskCalculatorService } from '../families/services/risk-calculator.service';
import { CreateRiskAssessmentDto } from '../families/dto/create-risk.dto';

/**
 * Serviço responsável pela sincronização de dados entre os tablets (offline) e a API central.
 * Lida com processamento em lote, transações e validação de consistência.
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
   * @param userId ID do usuário autenticado.
   */
  async getInitialSyncData(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user)
      throw new InternalServerErrorException('Usuário não encontrado.');

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

  /**
   * Processa um lote de sincronização vindo do tablet.
   * Utiliza transação para garantir que os dados sejam salvos de forma atômica ou revertidos em caso de erro crítico.
   * @param payload Dados sincronizados (Domicílios, Famílias, Cidadãos, Visitas).
   * @param userId ID do usuário que está realizando a sincronização.
   */
  async processBatchSync(payload: SyncBatchPayloadDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const inconsistencies: Record<string, any[]> = {
      households: [],
      families: [],
      individuals: [],
      visits: [],
    };
    const savedIds: Record<string, string[]> = {
      households: [],
      families: [],
      individuals: [],
      visits: [],
    };
    const failedIds = {
      households: new Set<string>(),
      families: new Set<string>(),
    };

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new InternalServerErrorException(
          'Usuário logado não encontrado no banco de dados.',
        );
      }

      // 1. Processar Domicílios
      await this.saveHouseholds(
        payload.households || [],
        user,
        queryRunner,
        inconsistencies,
        savedIds,
        failedIds,
      );

      // 2. Processar Famílias
      await this.saveFamilies(
        payload.families || [],
        payload.individuals || [],
        queryRunner,
        inconsistencies,
        savedIds,
        failedIds,
      );

      // 3. Processar Cidadãos (Indivíduos)
      await this.saveIndividuals(
        payload.individuals || [],
        queryRunner,
        inconsistencies,
        savedIds,
        failedIds,
      );

      // 4. Processar Visitas
      await this.saveVisits(
        payload.visits || [],
        queryRunner,
        inconsistencies,
        savedIds,
        failedIds,
      );

      await queryRunner.commitTransaction();

      return {
        sucesso: true,
        message: 'Lote processado com sucesso.',
        salvos: savedIds,
        inconsistencias: inconsistencies,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Erro crítico na sincronização: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Falha crítica no processamento: ${(error as Error).message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Valida e salva os domicílios do lote.
   */
  private async saveHouseholds(
    households: SyncHouseholdDataDto[],
    user: User,
    queryRunner: QueryRunner,
    inconsistencies: any,
    savedIds: any,
    failedIds: any,
  ) {
    for (const h of households) {
      const dto = plainToInstance(SyncHouseholdDataDto, h);
      const errors = await validate(dto);

      if (errors.length > 0) {
        inconsistencies.households.push({
          id: h.id,
          erro: 'Erro de validação de esquema',
        });
        if (h.id) failedIds.households.add(h.id);
        continue;
      }

      try {
        const { id, ...data } = h;
        let hdEntity = id
          ? await queryRunner.manager.findOne(Household, {
              where: { id },
              withDeleted: true,
            })
          : null;

        const baseData: DeepPartial<Household> = {
          ...data,
          createdBy: user || undefined,
        };

        if (hdEntity) {
          queryRunner.manager.merge(Household, hdEntity, baseData);
        } else {
          hdEntity = queryRunner.manager.create(Household, {
            ...baseData,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Household, hdEntity);
        if (hdEntity.id) savedIds.households.push(hdEntity.id);
      } catch (e) {
        inconsistencies.households.push({
          id: h.id,
          erro: (e as Error).message,
        });
        if (h.id) failedIds.households.add(h.id);
      }
    }
  }

  /**
   * Valida e salva as famílias, calculando automaticamente o risco baseado nos membros.
   */
  private async saveFamilies(
    families: SyncFamilyDataDto[],
    allIndividuals: SyncIndividualDataDto[],
    queryRunner: QueryRunner,
    inconsistencies: any,
    savedIds: any,
    failedIds: any,
  ) {
    const individualsByFamily = new Map<string, SyncIndividualDataDto[]>();
    for (const ind of allIndividuals) {
      if (ind.family_id) {
        const list = individualsByFamily.get(ind.family_id) || [];
        list.push(ind);
        individualsByFamily.set(ind.family_id, list);
      }
    }

    for (const f of families) {
      // Verifica se o domicílio pai falhou
      if (f.household_id && failedIds.households.has(f.household_id)) {
        inconsistencies.families.push({
          id: f.id,
          erro: 'Falha em cascata (Domicílio falhou)',
        });
        if (f.id) failedIds.families.add(f.id);
        continue;
      }

      const dto = plainToInstance(SyncFamilyDataDto, f);
      const errors = await validate(dto);
      if (errors.length > 0) {
        inconsistencies.families.push({
          id: f.id,
          erro: 'Erro de validação de dados',
        });
        if (f.id) failedIds.families.add(f.id);
        continue;
      }

      const familyInds = (f.id ? individualsByFamily.get(f.id) : []) || [];
      const riskPayload = this.mapRiskPayload(f, familyInds);

      let classificacao_risco = 'Sem Risco';
      let pontuacao_risco = 0;

      try {
        const riskResult = this.riskCalculatorService.calculateScoreAndClass(
          riskPayload,
          f.membros_declarados || 0,
        );
        pontuacao_risco = riskResult.finalScore;
        classificacao_risco = riskResult.riskClass;
      } catch (error) {
        if (error instanceof BadRequestException) {
          inconsistencies.families.push({
            id: f.id,
            erro: `Inconsistência de Risco: ${error.message}`,
          });
        } else {
          throw error;
        }
      }

      try {
        const { id, household_id, ...data } = f;
        let fEntity = id
          ? await queryRunner.manager.findOne(Family, {
              where: { id },
              withDeleted: true,
            })
          : null;

        const baseData: DeepPartial<Family> = {
          ...data,
          pontuacao_risco,
          classificacao_risco: classificacao_risco as FamilyRisk,
          household: household_id ? { id: household_id as any } : undefined,
          reside_desde: data.reside_desde || undefined,
        };

        if (fEntity) {
          queryRunner.manager.merge(Family, fEntity, baseData);
        } else {
          fEntity = queryRunner.manager.create(Family, {
            ...baseData,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Family, fEntity);
        if (fEntity.id) savedIds.families.push(fEntity.id);
      } catch (e) {
        inconsistencies.families.push({
          id: f.id,
          erro: (e as Error).message,
        });
        if (f.id) failedIds.families.add(f.id);
      }
    }
  }

  /**
   * Mapeia os dados dos cidadãos para o formato esperado pelo calculador de risco.
   */
  private mapRiskPayload(
    f: SyncFamilyDataDto,
    members: SyncIndividualDataDto[],
  ): CreateRiskAssessmentDto {
    const payload: CreateRiskAssessmentDto = {
      bedriddenCount: 0,
      physicalDisabilityCount: 0,
      mentalDisabilityCount: 0,
      severeMalnutritionCount: 0,
      drugAddictionCount: 0,
      unemployedCount: 0,
      illiterateCount: 0,
      under6MonthsCount: 0,
      over70YearsCount: 0,
      hypertensionCount: 0,
      diabetesCount: 0,
      basicSanitation: !f.saneamento_inadequado,
      roomsCount: 1, // Default para evitar divisão por zero
    };

    for (const ind of members) {
      const hc = ind.healthConditions || {};
      if (hc.acamado_domiciliado) payload.bedriddenCount++;
      if (ind.possui_deficiencia) payload.physicalDisabilityCount++;
      if (hc.uso_alcool || hc.uso_outras_drogas || hc.fumante)
        payload.drugAddictionCount++;
      if (ind.situacao_mercado_trabalho === JobStatus.DESEMPREGADO)
        payload.unemployedCount++;

      if (ind.data_nascimento) {
        const birthDate = new Date(ind.data_nascimento);
        const diffMs = Date.now() - birthDate.getTime();
        const ageMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
        const ageYears = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);

        if (ageMonths < 6) payload.under6MonthsCount++;
        if (ageYears > 70) payload.over70YearsCount++;
      }
      if (hc.hipertensao_arterial) payload.hypertensionCount++;
      if (hc.diabetes) payload.diabetesCount++;
    }

    return payload;
  }

  /**
   * Valida e salva os indivíduos (cidadãos) e suas condições de saúde.
   */
  private async saveIndividuals(
    individuals: SyncIndividualDataDto[],
    queryRunner: QueryRunner,
    inconsistencies: any,
    savedIds: any,
    failedIds: any,
  ) {
    for (const i of individuals) {
      if (i.family_id && failedIds.families.has(i.family_id)) {
        inconsistencies.individuals.push({
          id: i.id,
          erro: 'Falha em cascata (Família falhou)',
        });
        continue;
      }

      const dto = plainToInstance(SyncIndividualDataDto, i);
      const errors = await validate(dto);
      if (errors.length > 0) {
        inconsistencies.individuals.push({
          id: i.id,
          erro: 'Erro de validação',
        });
        continue;
      }

      try {
        const { id, family_id, healthConditions, ...data } = i;
        let iEnt = id
          ? await queryRunner.manager.findOne(Individual, {
              where: { id },
              relations: ['healthConditions'],
              withDeleted: true,
            })
          : null;

        const base: DeepPartial<Individual> = {
          ...data,
          family: family_id ? { id: family_id as any } : undefined,
          data_nascimento: data.data_nascimento
            ? new Date(data.data_nascimento)
            : undefined,
        };

        if (iEnt) {
          if (iEnt.healthConditions && healthConditions) {
            queryRunner.manager.merge(
              IndividualHealth,
              iEnt.healthConditions,
              healthConditions,
            );
          } else if (healthConditions) {
            iEnt.healthConditions = queryRunner.manager.create(
              IndividualHealth,
              healthConditions,
            );
          }
          queryRunner.manager.merge(Individual, iEnt, base);
        } else {
          iEnt = queryRunner.manager.create(Individual, {
            ...base,
            id: id || undefined,
          } as any);
          if (healthConditions) {
            iEnt.healthConditions = queryRunner.manager.create(
              IndividualHealth,
              healthConditions,
            );
          }
        }

        await queryRunner.manager.save(Individual, iEnt);
        if (iEnt.id) savedIds.individuals.push(iEnt.id);
      } catch (e) {
        inconsistencies.individuals.push({
          id: i.id,
          erro: (e as Error).message,
        });
      }
    }
  }

  /**
   * Valida e salva as visitas domiciliares.
   */
  private async saveVisits(
    visits: SyncVisitDataDto[],
    queryRunner: QueryRunner,
    inconsistencies: any,
    savedIds: any,
    failedIds: any,
  ) {
    for (const v of visits) {
      if (v.household_id && failedIds.households.has(v.household_id)) {
        inconsistencies.visits.push({
          id: v.id,
          erro: 'Falha em cascata (Domicílio falhou)',
        });
        continue;
      }

      try {
        const { id, household_id, family_id, individual_id, ...data } = v;
        let vEnt = id
          ? await queryRunner.manager.findOne(Visit, {
              where: { id },
              withDeleted: true,
            })
          : null;

        const base: DeepPartial<Visit> = {
          ...data,
          household: household_id ? { id: household_id as any } : undefined,
          family: family_id ? { id: family_id as any } : undefined,
          individual: individual_id ? { id: individual_id as any } : undefined,
          data_visita: data.data_visita
            ? new Date(data.data_visita)
            : undefined,
        };

        if (vEnt) {
          queryRunner.manager.merge(Visit, vEnt, base);
        } else {
          vEnt = queryRunner.manager.create(Visit, {
            ...base,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Visit, vEnt);
        if (vEnt.id) savedIds.visits.push(vEnt.id);
      } catch (e) {
        inconsistencies.visits.push({ id: v.id, erro: (e as Error).message });
      }
    }
  }
}
