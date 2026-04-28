import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import {
  Household,
  CreateHouseholdDto,
  UpdateHouseholdDto,
} from './household.entity';
import { Family } from '../families/family.entity';
import { Individual } from '../individuals/individual.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { Visit } from '../visits/visit.entity';
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';

/**
 * Serviço responsável pela gestão de domicílios (território).
 */
@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdRepository: Repository<Household>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra um novo domicílio no sistema, vinculando-o ao agente de saúde logado.
   * @param createHouseholdDto Dados do domicílio.
   * @param userId ID do usuário que está cadastrando.
   */
  async create(
    createHouseholdDto: CreateHouseholdDto,
    userId?: number,
  ): Promise<Household> {
    const household = new Household(createHouseholdDto);

    if (userId) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        household.createdBy = user;
      }
    }

    return this.householdRepository.save(household);
  }

  /**
   * Lista todos os domicílios, permitindo filtro opcional por logradouro e microárea.
   */
  async findAll(logradouro?: string, microarea?: string): Promise<Household[]> {
    const where: any = {};

    if (logradouro) {
      where.logradouro = ILike(`%${logradouro}%`);
    }

    if (microarea) {
      where.microarea = microarea;
    }

    return this.householdRepository.find({ where });
  }

  /**
   * Busca um domicílio específico pelo ID único do sistema.
   */
  async findOne(id: string): Promise<Household> {
    const household = await this.householdRepository.findOne({ where: { id } });
    if (!household) {
      throw new NotFoundException(`Domicílio com ID ${id} não encontrado`);
    }
    return household;
  }

  /**
   * Atualiza as informações de um domicílio existente.
   */
  async update(
    id: string,
    updateHouseholdDto: UpdateHouseholdDto,
  ): Promise<Household> {
    const household = await this.findOne(id);
    // Aplica as mudanças do DTO sobre a entidade carregada
    Object.assign(household, updateHouseholdDto);
    return this.householdRepository.save(household);
  }

  /**
   * Remove um domicílio do sistema (Soft Delete em Cascata).
   * Marca como excluído o domicílio, suas famílias, indivíduos, visitas e estratificações de risco.
   */
  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const household = await queryRunner.manager.findOne(Household, {
        where: { id },
      });

      if (!household) {
        throw new NotFoundException(`Domicílio com ID ${id} não encontrado`);
      }

      // 1. Soft Delete Visitas relacionadas ao domicílio
      await queryRunner.manager.softDelete(Visit, { household: { id } });

      // 2. Encontrar famílias para cascata
      const families = await queryRunner.manager.find(Family, {
        where: { household: { id } },
      });

      for (const family of families) {
        // Soft Delete Estratificações de Risco da Família
        await queryRunner.manager.softDelete(FamilyRiskStratification, {
          familyId: family.id,
        });

        // Soft Delete Indivíduos da Família e suas condições de saúde
        const individuals = await queryRunner.manager.find(Individual, {
          where: { family: { id: family.id } },
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
      }

      // 3. Soft Delete das Famílias
      if (families.length > 0) {
        await queryRunner.manager.softRemove(families);
      }

      // 4. Soft Delete do Domicílio
      await queryRunner.manager.softRemove(household);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Erro ao excluir domicílio e registros vinculados.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Busca todos os indivíduos que residem neste domicílio (diretamente ou via família).
   */
  async findIndividuals(householdId: string): Promise<any[]> {
    return this.householdRepository.manager.getRepository('Individual').find({
      where: [
        { household_id: householdId },
        { family: { household: { id: householdId } } },
      ] as any,
      relations: ['family', 'healthConditions'],
    });
  }
}
