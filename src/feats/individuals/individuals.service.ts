import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Individual,
  CreateIndividualDto,
  UpdateIndividualDto,
} from './individual.entity';
import { Family } from '../families/family.entity';

@Injectable()
export class IndividualsService {
  constructor(
    @InjectRepository(Individual)
    private readonly individualRepository: Repository<Individual>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
  ) {}

  async create(createIndividualDto: CreateIndividualDto): Promise<Individual> {
    const family = await this.familyRepository.findOne({
      where: { id: createIndividualDto.family_id },
    });

    if (!family) {
      throw new NotFoundException('Família não encontrada.');
    }

    const newIndividual = new Individual({
      ...createIndividualDto,
      family,
      data_nascimento: new Date(createIndividualDto.data_nascimento),
    });

    return this.individualRepository.save(newIndividual);
  }

  async findAll(): Promise<Individual[]> {
    return this.individualRepository.find({ relations: ['family'] });
  }

  async findOne(id: string): Promise<Individual> {
    const individual = await this.individualRepository.findOne({
      where: { id },
      relations: ['family'],
    });

    if (!individual) {
      throw new NotFoundException('Indivíduo não encontrado.');
    }

    return individual;
  }

  async update(
    id: string,
    updateIndividualDto: UpdateIndividualDto,
  ): Promise<Individual> {
    const individual = await this.findOne(id);

    let family = individual.family;

    if (updateIndividualDto.family_id) {
      const foundFamily = await this.familyRepository.findOne({
        where: { id: updateIndividualDto.family_id },
      });
      if (!foundFamily) {
        throw new NotFoundException(
          'Família não encontrada para o id informado.',
        );
      }
      family = foundFamily;
    }

    Object.assign(individual, {
      ...updateIndividualDto,
      family,
      ...(updateIndividualDto.data_nascimento && {
        data_nascimento: new Date(updateIndividualDto.data_nascimento),
      }),
    });

    return this.individualRepository.save(individual);
  }

  async remove(id: string): Promise<void> {
    const individual = await this.findOne(id);
    await this.individualRepository.softRemove(individual);
  }
}
