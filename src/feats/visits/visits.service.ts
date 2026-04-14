import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit, CreateVisitDto, UpdateVisitDto } from './visit.entity';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';

/**
 * Serviço responsável por registrar e gerenciar as visitas domiciliares dos Agentes de Saúde.
 * Garante que a visita esteja vinculada corretamente a um domicílio, família ou cidadão.
 */
@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
    @InjectRepository(Family)
    private familiesRepository: Repository<Family>,
    @InjectRepository(Individual)
    private individualsRepository: Repository<Individual>,
  ) {}

  /**
   * Registra uma nova visita domiciliar.
   * Valida dependências e a existência de um Responsável Familiar caso a visita seja para uma Família.
   */
  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    const household = createVisitDto.household_id
      ? await this.householdsRepository.findOne({
          where: { id: createVisitDto.household_id },
        })
      : null;

    if (createVisitDto.household_id && !household) {
      throw new NotFoundException('Domicílio informado não encontrado.');
    }

    const family = createVisitDto.family_id
      ? await this.familiesRepository.findOne({
          where: { id: createVisitDto.family_id },
        })
      : null;

    if (createVisitDto.family_id) {
      if (!family) {
        throw new NotFoundException('Família informada não encontrada.');
      }

      // Regra e-SUS: Visitas familiares exigem um responsável ativo
      const hasResponsible = await this.individualsRepository.findOne({
        where: {
          family: { id: family.id },
          is_responsavel: true,
          arquivado: false,
        },
      });

      if (!hasResponsible) {
        throw new BadRequestException(
          'Não é possível registrar visita familiar: esta família não possui um Responsável Familiar ativo.',
        );
      }
    }

    const individual = createVisitDto.individual_id
      ? await this.individualsRepository.findOne({
          where: { id: createVisitDto.individual_id },
        })
      : null;

    if (createVisitDto.individual_id && !individual) {
      throw new NotFoundException('Cidadão informado não encontrado.');
    }

    // Validação mínima de vínculo
    if (!household && !family && !individual) {
      throw new BadRequestException(
        'A visita deve estar vinculada a pelo menos um Imóvel, Família ou Cidadão.',
      );
    }

    const visit = this.visitsRepository.create({
      ...createVisitDto,
      household,
      family,
      individual,
    });

    return this.visitsRepository.save(visit);
  }

  /**
   * Lista visitas com filtros opcionais por domicílio, família ou indivíduo.
   */
  async findAll(options?: {
    householdId?: string;
    familyId?: string;
    individualId?: string;
  }): Promise<Visit[]> {
    const where: any = {};
    if (options?.householdId) where.household = { id: options.householdId };
    if (options?.familyId) where.family = { id: options.familyId };
    if (options?.individualId) where.individual = { id: options.individualId };

    return this.visitsRepository.find({
      where,
      relations: ['household', 'family', 'individual'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca detalhes de uma visita específica.
   */
  async findOne(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: ['household', 'family', 'individual'],
    });

    if (!visit) {
      throw new NotFoundException(`Visita com ID ${id} não encontrada.`);
    }

    return visit;
  }

  /**
   * Atualiza uma visita existente.
   */
  async update(id: string, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    const visit = await this.findOne(id);

    Object.assign(visit, updateVisitDto);

    // Atualização manual de relacionamentos se fornecidos
    if (updateVisitDto.household_id !== undefined) {
      visit.household = updateVisitDto.household_id
        ? await this.householdsRepository.findOne({
            where: { id: updateVisitDto.household_id },
          })
        : null;
    }
    if (updateVisitDto.family_id !== undefined) {
      visit.family = updateVisitDto.family_id
        ? await this.familiesRepository.findOne({
            where: { id: updateVisitDto.family_id },
          })
        : null;
    }
    if (updateVisitDto.individual_id !== undefined) {
      visit.individual = updateVisitDto.individual_id
        ? await this.individualsRepository.findOne({
            where: { id: updateVisitDto.individual_id },
          })
        : null;
    }

    return this.visitsRepository.save(visit);
  }

  /**
   * Remove uma visita (Soft Delete).
   */
  async remove(id: string): Promise<void> {
    const visit = await this.findOne(id);
    await this.visitsRepository.softRemove(visit);
  }
}
