import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Family,
  CreateFamilyDto,
  UpdateFamilyDto,
  FamilyStatus,
  FamilyIncome,
} from './family.entity';
import { FamilyRiskStratification } from './entities/family-risk.entity';
import { Individual } from '../individuals/individual.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { Visit } from '../visits/visit.entity';

/**
 * Serviço de gerenciamento de famílias.
 * Lida com CRUD básico e lógicas específicas como mudança de domicílio e sincronização de renda.
 */
@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cria uma nova família vinculada a um domicílio.
   * O DatabaseInterceptor trata automaticamente duplicidade de prontuário.
   */
  async create(createFamilyDto: CreateFamilyDto): Promise<Family> {
    const { household_id, ...rest } = createFamilyDto;
    const family = new Family({
      ...rest,
      reside_desde: createFamilyDto.reside_desde,
      household_id: household_id || null,
      household: household_id ? ({ id: household_id } as any) : null,
    });

    return await this.familyRepository.save(family);
  }

  /**
   * Retorna todas as famílias (não arquivadas por padrão).
   */
  async findAll(): Promise<Family[]> {
    return this.familyRepository.find();
  }

  /**
   * Busca uma única família pelo ID, lançando erro se não encontrar.
   */
  async findOne(id: string): Promise<Family> {
    const family = await this.familyRepository.findOne({ where: { id } });
    if (!family) {
      throw new NotFoundException(`Família com ID ${id} não encontrada`);
    }
    return family;
  }

  /**
   * Atualiza os dados de uma família.
   */
  async update(id: string, updateFamilyDto: UpdateFamilyDto): Promise<Family> {
    const family = await this.findOne(id);
    const { household_id, ...rest } = updateFamilyDto;

    // Atualiza apenas as propriedades enviadas no DTO
    Object.assign(family, rest);

    if (household_id !== undefined) {
      family.household_id = household_id || null;
      family.household = household_id ? ({ id: household_id } as any) : null;
    }

    if (updateFamilyDto.reside_desde !== undefined) {
      family.reside_desde = updateFamilyDto.reside_desde;
    }

    return await this.familyRepository.save(family);
  }

  /**
   * Remove uma família (Soft Delete em Cascata).
   * Marca como excluída a família, seus membros (indivíduos), visitas e estratificações de risco.
   */
  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const family = await queryRunner.manager.findOne(Family, {
        where: { id },
      });

      if (!family) {
        throw new NotFoundException(`Família com ID ${id} não encontrada`);
      }

      // 1. Soft Delete Estratificações de Risco
      await queryRunner.manager.softDelete(FamilyRiskStratification, {
        familyId: id,
      });

      // 2. Soft Delete Visitas relacionadas à família
      await queryRunner.manager.softDelete(Visit, { family: { id } });

      // 3. Soft Delete Indivíduos e suas condições de saúde
      const individuals = await queryRunner.manager.find(Individual, {
        where: { family: { id } },
        relations: ['healthConditions'],
      });

      if (individuals.length > 0) {
        const healthIds = individuals
          .map((ind) => ind.healthConditions?.id)
          .filter(Boolean);

        if (healthIds.length > 0) {
          await queryRunner.manager.softDelete(IndividualHealth, healthIds);
        }
        await queryRunner.manager.softRemove(individuals);
      }

      // 4. Soft Delete da Família
      await queryRunner.manager.softRemove(family);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erro ao excluir família em cascata: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Sincroniza apenas a renda familiar utilizando Bloqueio Pessimista.
   * Garante que dois agentes não sobrescrevam a renda simultaneamente em ambientes concorrentes.
   */
  async syncFamilyData(id: string, newIncome: FamilyIncome): Promise<Family> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Bloqueio pessimista 'pessimistic_write' aguarda outras transações terminarem
      const family = await queryRunner.manager.findOne(Family, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!family) {
        throw new NotFoundException(`Família com ID ${id} não encontrada`);
      }

      family.renda_familiar = newIncome;
      const updatedFamily = await queryRunner.manager.save(family);

      await queryRunner.commitTransaction();
      return updatedFamily;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Erro ao sincronizar renda familiar.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registra a mudança de uma família, desvinculando-a do domicílio atual
   * e arquivando-a para preservar o histórico.
   */
  async registerFamilyMove(id: string, reason?: string): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['household'],
    });

    if (!family) {
      throw new NotFoundException(`Família com ID ${id} não encontrada`);
    }

    const oldHouseholdId = family.household?.id;
    const moveLog = `Mudou-se em ${new Date().toISOString()}${
      oldHouseholdId ? `; Domicílio prévio: ${oldHouseholdId}` : ''
    }${reason ? `; Motivo: ${reason}` : ''}`;

    family.historico_domicilios = family.historico_domicilios
      ? [...family.historico_domicilios, moveLog]
      : [moveLog];

    family.household = null;
    family.status_mudanca = FamilyStatus.MUDOU_SE;
    family.arquivada = true;

    return await this.familyRepository.save(family);
  }
}
