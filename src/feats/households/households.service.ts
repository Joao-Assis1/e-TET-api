import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../users/user.entity';
import {
  Household,
  CreateHouseholdDto,
  UpdateHouseholdDto,
} from './household.entity';

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
   * Lista todos os domicílios, permitindo filtro opcional por logradouro.
   */
  async findAll(logradouro?: string): Promise<Household[]> {
    if (logradouro) {
      return this.householdRepository.find({
        where: { logradouro: ILike(`%${logradouro}%`) },
      });
    }
    return this.householdRepository.find();
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
   * Remove um domicílio do sistema (Soft Delete).
   */
  async remove(id: string): Promise<void> {
    const household = await this.findOne(id);
    await this.householdRepository.softRemove(household);
  }

  /**
   * Busca todos os indivíduos que residem neste domicílio, independente da família.
   */
  async findIndividuals(householdId: string): Promise<any[]> {
    return this.householdRepository.manager.getRepository('Individual').find({
      where: { household_id: householdId },
      relations: ['family', 'healthConditions'],
    });
  }
}
