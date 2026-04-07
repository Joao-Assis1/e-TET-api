import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit, CreateVisitDto, UpdateVisitDto } from './visit.entity';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';

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

  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    let household: Household | null = null;
    if (createVisitDto.household_id) {
      household = await this.householdsRepository.findOne({
        where: { id: createVisitDto.household_id },
      });
      if (!household) {
        throw new NotFoundException('Household not found');
      }
    }

    let family: Family | null = null;
    if (createVisitDto.family_id) {
      family = await this.familiesRepository.findOne({
        where: { id: createVisitDto.family_id },
      });
      if (!family) {
        throw new NotFoundException('Family not found');
      }

      // Validação Crítica da Regra de Negócio: Família PRECISA ter responsável
      const hasResponsible = await this.individualsRepository.findOne({
        where: { family: { id: family.id }, is_responsavel: true, arquivado: false },
      });

      if (!hasResponsible) {
        throw new BadRequestException(
          'Não é possível registar uma visita à família. Esta família não possui nenhum Responsável Familiar ativo.',
        );
      }
    }

    let individual: Individual | null = null;
    if (createVisitDto.individual_id) {
      individual = await this.individualsRepository.findOne({
        where: { id: createVisitDto.individual_id },
      });
      if (!individual) {
        throw new NotFoundException('Individual not found');
      }
    }

    if (!household && !family && !individual) {
      throw new BadRequestException('A visita deve estar vinculada a pelo menos um Imóvel, Família ou Cidadão.');
    }

    const visit = this.visitsRepository.create({
      ...createVisitDto,
      household,
      family,
      individual,
    });
    return this.visitsRepository.save(visit);
  }

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

  findOne(id: string): Promise<Visit | null> {
    return this.visitsRepository.findOne({
      where: { id },
      relations: ['household', 'family', 'individual'],
    });
  }

  async update(id: string, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    const visit = await this.findOne(id);
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    Object.assign(visit, updateVisitDto);
    // update relationships if provided
    if (updateVisitDto.household_id !== undefined) {
      if (updateVisitDto.household_id === null) {
        visit.household = null;
      } else {
        const household = await this.householdsRepository.findOne({ where: { id: updateVisitDto.household_id } });
        if (household) visit.household = household;
      }
    }
    if (updateVisitDto.family_id !== undefined) {
      if (updateVisitDto.family_id === null) {
        visit.family = null;
      } else {
        const family = await this.familiesRepository.findOne({ where: { id: updateVisitDto.family_id } });
        if (family) visit.family = family;
      }
    }
    if (updateVisitDto.individual_id !== undefined) {
      if (updateVisitDto.individual_id === null) {
        visit.individual = null;
      } else {
        const individual = await this.individualsRepository.findOne({ where: { id: updateVisitDto.individual_id } });
        if (individual) visit.individual = individual;
      }
    }

    return this.visitsRepository.save(visit);
  }

  async remove(id: string): Promise<void> {
    const visit = await this.findOne(id);
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    await this.visitsRepository.softRemove(visit);
  }
}
