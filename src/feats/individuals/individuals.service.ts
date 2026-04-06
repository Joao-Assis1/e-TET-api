import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  Individual,
  CreateIndividualDto,
  UpdateIndividualDto,
} from './individual.entity';
import { IndividualHealth } from './individual-health.entity';
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

    await this.verifyAndSwapResponsavel(
      family.id,
      createIndividualDto.is_responsavel || false,
      createIndividualDto.cpf,
      createIndividualDto.cartao_sus,
    );

    const { family_id, healthConditions, ...individualData } = createIndividualDto;

    const newIndividual = new Individual({
      ...individualData,
      family,
      data_nascimento: new Date(createIndividualDto.data_nascimento),
    });

    if (healthConditions && !createIndividualDto.recusa_cadastro) {
      const health = new IndividualHealth();
      Object.assign(health, healthConditions);
      newIndividual.healthConditions = health;
    }

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

    if (updateIndividualDto.is_responsavel !== undefined) {
      await this.verifyAndSwapResponsavel(
        family.id,
        updateIndividualDto.is_responsavel,
        updateIndividualDto.cpf || individual.cpf,
        updateIndividualDto.cartao_sus || individual.cartao_sus,
        individual.id
      );
    }

    const { family_id, healthConditions, ...updateData } = updateIndividualDto;

    if (healthConditions) {
      if (!individual.healthConditions) {
        individual.healthConditions = new IndividualHealth();
      }
      Object.assign(individual.healthConditions, healthConditions);
    }

    Object.assign(individual, {
      ...updateData,
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

  async registerExit(id: string, motivo: string): Promise<Individual> {
    const individual = await this.findOne(id);

    individual.arquivado = true;
    individual.motivo_saida = motivo;
    
    if (individual.is_responsavel) {
      individual.is_responsavel = false;
    }

    return this.individualRepository.save(individual);
  }

  private async verifyAndSwapResponsavel(
    familyId: string,
    isResponsavel: boolean,
    cpf?: string,
    cartaoSus?: string,
    currentIndividualId?: string
  ) {
    if (!isResponsavel) return;

    if (!cpf && !cartaoSus) {
      throw new BadRequestException(
        'O Responsável Familiar deve obrigatoriamente possuir CPF ou Cartão SUS preenchido.',
      );
    }

    const whereClause: any = { family: { id: familyId }, is_responsavel: true, arquivado: false };
    if (currentIndividualId) {
      whereClause.id = Not(currentIndividualId);
    }

    const existingResponsavel = await this.individualRepository.findOne({
      where: whereClause,
    });

    if (existingResponsavel) {
      existingResponsavel.is_responsavel = false;
      await this.individualRepository.save(existingResponsavel);
    }
  }
}
