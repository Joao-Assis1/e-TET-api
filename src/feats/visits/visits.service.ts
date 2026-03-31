import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit, CreateVisitDto, UpdateVisitDto } from './visit.entity';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
    @InjectRepository(Individual)
    private individualsRepository: Repository<Individual>,
  ) {}

  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    const household = await this.householdsRepository.findOne({
      where: { id: createVisitDto.household_id },
    });
    if (!household) {
      throw new NotFoundException('Household not found');
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

    const visit = this.visitsRepository.create({
      ...createVisitDto,
      household,
      individual,
    });
    return this.visitsRepository.save(visit);
  }

  findAll(): Promise<Visit[]> {
    return this.visitsRepository.find({ relations: ['household', 'individual'] });
  }

  findOne(id: string): Promise<Visit | null> {
    return this.visitsRepository.findOne({
      where: { id },
      relations: ['household', 'individual'],
    });
  }

  async update(id: string, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    const visit = await this.findOne(id);
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    Object.assign(visit, updateVisitDto);
    
    // update relationships if provided
    if (updateVisitDto.household_id) {
      const household = await this.householdsRepository.findOne({ where: { id: updateVisitDto.household_id } });
      if (household) visit.household = household;
    }
    if (updateVisitDto.individual_id) {
      const individual = await this.individualsRepository.findOne({ where: { id: updateVisitDto.individual_id } });
      if (individual) visit.individual = individual;
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
