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
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';

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

    const households = await this.dataSource.manager.find(Household);

    const householdIds = households.map((h) => h.id);
    let families: Family[] = [];
    let individuals: Individual[] = [];
    let visits: Visit[] = [];

    // Busca todos os dados em vez de filtrar apenas pelos que têm domicílio
    const rawFamilies = await this.dataSource.manager.find(Family);

    // Enriquecer famílias com sentinelas
    families = await Promise.all(rawFamilies.map(async (f) => {
      const sentinels = await this.dataSource.manager.findOne(FamilyRiskStratification, {
        where: { familyId: f.id },
        order: { createdAt: 'DESC' }
      });
      return { ...f, sentinels };
    }));

    individuals = await this.dataSource.manager
      .createQueryBuilder(Individual, 'individual')
      .leftJoinAndSelect('individual.healthConditions', 'hc')
      .getMany();

    visits = await this.dataSource.manager.find(Visit);

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
   * Utiliza transação para garantir que os dados sejam salvos de forma atômica ou revertidos em caso de erro crítico.
   * @param payload Dados sincronizados (Domicílios, Famílias, Cidadãos, Visitas).
   * @param userId ID do usuário que está realizando a sincronização.
   */
  async processBatchSync(payload: SyncBatchPayloadDto, userId: number) {
    if (!userId) {
      this.logger.error(
        'Sync falhou: userId não fornecido no processBatchSync',
      );
      throw new BadRequestException(
        'ID de usuário obrigatório para sincronização.',
      );
    }

    this.logger.log(
      `[Sync] Iniciando processamento para usuário ID: ${userId}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const inconsistencies: Record<string, any[]> = {
      households: [],
      families: [],
      individuals: [],
      visits: [],
    };
    const savedData: Record<string, any[]> = {
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
      this.logger.log(`Iniciando processBatchSync para usuário ${userId}`);
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new InternalServerErrorException(
          'Usuário logado não encontrado no banco de dados.',
        );
      }

      this.logger.log(
        `Processando ${payload.households?.length || 0} domicílios, ${payload.families?.length || 0} famílias, ${payload.individuals?.length || 0} cidadãos, ${payload.visits?.length || 0} visitas`,
      );

      // 1. Processar Domicílios
      await this.saveHouseholds(
        payload.households || [],
        user,
        queryRunner,
        inconsistencies,
        savedData,
        failedIds,
      );

      // 2. Processar Famílias
      await this.saveFamilies(
        payload.families || [],
        payload.individuals || [],
        queryRunner,
        inconsistencies,
        savedData,
        failedIds,
      );

      // 3. Processar Cidadãos (Indivíduos)
      await this.saveIndividuals(
        payload.individuals || [],
        queryRunner,
        inconsistencies,
        savedData,
        failedIds,
      );

      // 4. Processar Visitas
      await this.saveVisits(
        payload.visits || [],
        queryRunner,
        inconsistencies,
        savedData,
        failedIds,
      );

      await queryRunner.commitTransaction();

      return {
        sucesso: true,
        message: 'Lote processado com sucesso.',
        households: savedData.households,
        families: savedData.families,
        individuals: savedData.individuals,
        visits: savedData.visits,
        inconsistencias: inconsistencies,
      };
    } catch (error) {
      this.logger.error(
        `Erro crítico na sincronização: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Falha crítica no processamento do lote de sincronização.',
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
    savedData: any,
    failedIds: any,
  ) {
    for (const h of households) {
      this.logger.log(`Salvando domicílio ID: ${h.id || h._tempId}`);
      const dto = plainToInstance(SyncHouseholdDataDto, h);
      const errors = await validate(dto);

      if (errors.length > 0) {
        this.logger.warn(`Erro de validação no domicílio ${h.id || h._tempId}`);
        inconsistencies.households.push({
          id: h.id || h._tempId,
          erro: 'Erro de validação de esquema',
        });
        if (h.id) failedIds.households.add(h.id);
        continue;
      }

      try {
        const { id, _tempId, ...data } = h;
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
          // RESOLUÇÃO DE CONFLITO: Timestamp
          const incomingUpdate = data.updatedAt
            ? new Date(data.updatedAt).getTime()
            : 0;
          const existingUpdate = hdEntity.updated_at
            ? new Date(hdEntity.updated_at).getTime()
            : 0;

          if (incomingUpdate > 0 && incomingUpdate < existingUpdate) {
            this.logger.log(
              `[Sync] Domicílio ${id}: Versão do servidor é mais recente. Pulando.`,
            );
            savedData.households.push({ ...hdEntity, _tempId });
            continue;
          }
          queryRunner.manager.merge(Household, hdEntity, baseData);
        } else {
          hdEntity = queryRunner.manager.create(Household, {
            ...baseData,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Household, hdEntity);
        if (hdEntity.id) {
          this.logger.log(`[Sync] Domicílio salvo com sucesso: ${hdEntity.id}`);
          savedData.households.push({ ...hdEntity, _tempId });
        }
      } catch (e) {
        this.logger.error(
          `[Sync] Erro ao salvar domicílio ${h.id || h._tempId}: ${(e as Error).message}`,
        );
        inconsistencies.households.push({
          id: h.id || h._tempId,
          erro: 'Erro interno ao processar registro',
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
    savedData: any,
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
      this.logger.log(`Salvando família ID: ${f.id || f._tempId}`);

      // Verifica se o domicílio pai falhou
      if (f.household_id && failedIds.households.has(f.household_id)) {
        this.logger.warn(
          `Família ${f.id || f._tempId} pulada: Domicílio pai falhou`,
        );
        inconsistencies.families.push({
          id: f.id || f._tempId,
          erro: 'Falha em cascata (Domicílio falhou)',
        });
        if (f.id) failedIds.families.add(f.id);
        continue;
      }

      const dto = plainToInstance(SyncFamilyDataDto, f);
      const errors = await validate(dto);
      if (errors.length > 0) {
        this.logger.warn(`Erro de validação na família ${f.id || f._tempId}`);
        inconsistencies.families.push({
          id: f.id || f._tempId,
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
            id: f.id || f._tempId,
            erro: `Inconsistência de Risco: ${error.message}`,
          });
        } else {
          throw error;
        }
      }

      try {
        const { id, _tempId, household_id, ...data } = f;
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
          // RESOLUÇÃO DE CONFLITO: Timestamp
          const incomingUpdate = data.updatedAt
            ? new Date(data.updatedAt).getTime()
            : 0;
          const existingUpdate = fEntity.updated_at
            ? new Date(fEntity.updated_at).getTime()
            : 0;

          if (incomingUpdate > 0 && incomingUpdate < existingUpdate) {
            this.logger.log(
              `[Sync] Família ${id}: Versão do servidor é mais recente. Pulando.`,
            );
            savedData.families.push({ ...fEntity, _tempId });
            continue;
          }
          queryRunner.manager.merge(Family, fEntity, baseData);
        } else {
          fEntity = queryRunner.manager.create(Family, {
            ...baseData,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Family, fEntity);
        if (fEntity.id) {
          this.logger.log(`[Sync] Família salva com sucesso: ${fEntity.id}`);
          savedData.families.push({ ...fEntity, _tempId });
        }
      } catch (e) {
        this.logger.error(
          `[Sync] Erro ao salvar família ${f.id || f._tempId}: ${(e as Error).message}`,
        );
        inconsistencies.families.push({
          id: f.id || f._tempId,
          erro: 'Erro interno ao processar registro',
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
    savedData: any,
    failedIds: any,
  ) {
    for (const i of individuals) {
      this.logger.log(`Salvando cidadão ID: ${i.id || i._tempId}`);
      if (i.family_id && failedIds.families.has(i.family_id)) {
        this.logger.warn(
          `Cidadão ${i.id || i._tempId} pulado: Família pai falhou`,
        );
        inconsistencies.individuals.push({
          id: i.id || i._tempId,
          erro: 'Falha em cascata (Família falhou)',
        });
        continue;
      }

      const dto = plainToInstance(SyncIndividualDataDto, i);
      const errors = await validate(dto);
      if (errors.length > 0) {
        this.logger.warn(`Erro de validação no cidadão ${i.id || i._tempId}`);
        inconsistencies.individuals.push({
          id: i.id || i._tempId,
          erro: 'Erro de validação',
        });
        continue;
      }

      try {
        const { id, _tempId, family_id, healthConditions, ...data } = i;
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
          // Evitar violação de UNIQUE constraint com strings vazias no Neon
          cpf: data.cpf && data.cpf.trim() !== '' ? data.cpf : (null as any),
          cartao_sus:
            data.cartao_sus && data.cartao_sus.trim() !== ''
              ? data.cartao_sus
              : (null as any),
          // Fallbacks para campos que não aceitam NULL no Neon
          possui_deficiencia: data.possui_deficiencia ?? false,
          frequenta_escola: data.frequenta_escola ?? false,
          plano_saude: data.plano_saude ?? false,
          comunidade_tradicional: data.comunidade_tradicional ?? false,
          frequenta_cuidador_tradicional:
            data.frequenta_cuidador_tradicional ?? false,
          participa_grupo_comunitario:
            data.participa_grupo_comunitario ?? false,
          possui_plano_saude: data.possui_plano_saude ?? false,
          pertence_povo_tradicional: data.pertence_povo_tradicional ?? false,
          usa_outras_praticas: data.usa_outras_praticas ?? false,
        };

        if (iEnt) {
          // RESOLUÇÃO DE CONFLITO: Timestamp
          const incomingUpdate = data.updatedAt
            ? new Date(data.updatedAt).getTime()
            : 0;
          const existingUpdate = iEnt.updated_at
            ? new Date(iEnt.updated_at).getTime()
            : 0;

          if (incomingUpdate > 0 && incomingUpdate < existingUpdate) {
            this.logger.log(
              `[Sync] Cidadão ${id}: Versão do servidor é mais recente. Pulando.`,
            );
            savedData.individuals.push({ ...iEnt, _tempId });
            continue;
          }

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
        if (iEnt.id) {
          this.logger.log(`[Sync] Cidadão salvo com sucesso: ${iEnt.id}`);
          savedData.individuals.push({ ...iEnt, _tempId });
        }
      } catch (e) {
        this.logger.error(
          `[Sync] Erro ao salvar cidadão ${i.id || i._tempId}: ${(e as Error).message}`,
        );
        inconsistencies.individuals.push({
          id: i.id || i._tempId,
          erro: 'Erro interno ao processar registro',
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
    savedData: any,
    failedIds: any,
  ) {
    for (const v of visits) {
      if (v.household_id && failedIds.households.has(v.household_id)) {
        inconsistencies.visits.push({
          id: v.id || v._tempId,
          erro: 'Falha em cascata (Domicílio falhou)',
        });
        continue;
      }

      try {
        const { id, _tempId, household_id, family_id, individual_id, ...data } =
          v;
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
          // RESOLUÇÃO DE CONFLITO: Timestamp
          const incomingUpdate = data.updatedAt
            ? new Date(data.updatedAt).getTime()
            : 0;
          const existingUpdate = vEnt.updated_at
            ? new Date(vEnt.updated_at).getTime()
            : 0;

          if (incomingUpdate > 0 && incomingUpdate < existingUpdate) {
            this.logger.log(
              `[Sync] Visita ${id}: Versão do servidor é mais recente. Pulando.`,
            );
            savedData.visits.push({ ...vEnt, _tempId });
            continue;
          }
          queryRunner.manager.merge(Visit, vEnt, base);
        } else {
          vEnt = queryRunner.manager.create(Visit, {
            ...base,
            id: id || undefined,
          } as any);
        }

        await queryRunner.manager.save(Visit, vEnt);
        if (vEnt.id) {
          savedData.visits.push({ ...vEnt, _tempId });
        }
      } catch (e) {
        this.logger.error(
          `[Sync] Erro ao salvar visita ${v.id || v._tempId}: ${(e as Error).message}`,
        );
        inconsistencies.visits.push({
          id: v.id || v._tempId,
          erro: 'Erro interno ao processar registro',
        });
      }
    }
  }
}
