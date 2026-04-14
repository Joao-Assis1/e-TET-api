import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  Individual,
  CreateIndividualDto,
  UpdateIndividualDto,
} from './individual.entity';
import { IndividualHealth } from './individual-health.entity';
import { Family } from '../families/family.entity';

/**
 * Serviço responsável pela gestão de cidadãos (indivíduos).
 * Controla o vínculo familiar, condições de saúde e regras de Responsável Familiar.
 */
@Injectable()
export class IndividualsService {
  constructor(
    @InjectRepository(Individual)
    private readonly individualRepository: Repository<Individual>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
  ) {}

  /**
   * Cadastra um novo cidadão vinculado a uma família.
   * Valida automaticamente se já existe um responsável familiar e faz a troca se necessário.
   */
  async create(createIndividualDto: CreateIndividualDto): Promise<Individual> {
    const family = await this.familyRepository.findOne({
      where: { id: createIndividualDto.family_id },
    });

    if (!family) {
      throw new NotFoundException('Família associada não encontrada.');
    }

    // Regra de negócio: Apenas um responsável ativo por família
    await this.verifyAndSwapResponsavel(
      family.id,
      createIndividualDto.is_responsavel || false,
      createIndividualDto.cpf,
      createIndividualDto.cartao_sus,
    );

    const { family_id, healthConditions, ...individualData } =
      createIndividualDto;

    const newIndividual = new Individual({
      ...individualData,
      family_id: family.id,
      family,
      household_id:
        family.household_id ||
        (family.household && family.household.id) ||
        null,
      data_nascimento: new Date(createIndividualDto.data_nascimento),
    });

    // Adiciona condições de saúde se não houver recusa de cadastro
    if (healthConditions && !createIndividualDto.recusa_cadastro) {
      const health = new IndividualHealth();
      Object.assign(health, healthConditions);
      newIndividual.healthConditions = health;
    }

    return this.individualRepository.save(newIndividual);
  }

  /**
   * Retorna todos os cidadãos cadastrados.
   */
  async findAll(): Promise<Individual[]> {
    return this.individualRepository.find({ relations: ['family'] });
  }

  /**
   * Busca um cidadão detalhado pelo ID.
   */
  async findOne(id: string): Promise<Individual> {
    const individual = await this.individualRepository.findOne({
      where: { id },
      relations: ['family', 'healthConditions'],
    });

    if (!individual) {
      throw new NotFoundException('Indivíduo não encontrado.');
    }

    return individual;
  }

  /**
   * Atualiza os dados de um cidadão, incluindo mudança de família e status de responsável.
   */
  async update(
    id: string,
    updateIndividualDto: UpdateIndividualDto,
  ): Promise<Individual> {
    const individual = await this.findOne(id);

    let family = individual.family;

    // Se houve mudança de família, valida a nova família
    if (updateIndividualDto.family_id) {
      const foundFamily = await this.familyRepository.findOne({
        where: { id: updateIndividualDto.family_id },
      });
      if (!foundFamily) {
        throw new NotFoundException('Nova família informada não encontrada.');
      }
      family = foundFamily;
    }

    // Se estiver se tornando responsável, remove o anterior
    if (updateIndividualDto.is_responsavel !== undefined) {
      await this.verifyAndSwapResponsavel(
        family.id,
        updateIndividualDto.is_responsavel,
        updateIndividualDto.cpf || individual.cpf,
        updateIndividualDto.cartao_sus || individual.cartao_sus,
        individual.id,
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
      family_id: family.id,
      family,
      household_id:
        family.household_id ||
        (family.household && family.household.id) ||
        null,
      ...(updateIndividualDto.data_nascimento && {
        data_nascimento: new Date(updateIndividualDto.data_nascimento),
      }),
    });

    return this.individualRepository.save(individual);
  }

  /**
   * Soft delete de um cidadão.
   */
  async remove(id: string): Promise<void> {
    const individual = await this.findOne(id);
    await this.individualRepository.softRemove(individual);
  }

  /**
   * Registra a saída (mudança/óbito) de um cidadão do território.
   */
  async registerExit(id: string, motivo: string): Promise<Individual> {
    const individual = await this.findOne(id);

    individual.arquivado = true;
    individual.motivo_saida = motivo;

    // Se era responsável, perde o status ao sair
    if (individual.is_responsavel) {
      individual.is_responsavel = false;
    }

    return this.individualRepository.save(individual);
  }

  /**
   * Garante que apenas um cidadão seja marcado como 'is_responsavel' por família.
   * Se um novo responsável for definido, o antigo é destituído automaticamente.
   */
  private async verifyAndSwapResponsavel(
    familyId: string,
    isResponsavel: boolean,
    cpf?: string,
    cartaoSus?: string,
    currentIndividualId?: string,
  ) {
    if (!isResponsavel) return;

    // O responsável familiar DEVE ter documento identificado para o e-SUS
    if (!cpf && !cartaoSus) {
      throw new BadRequestException(
        'O Responsável Familiar deve possuir obrigatoriamente CPF ou Cartão SUS.',
      );
    }

    const whereClause: any = {
      family: { id: familyId },
      is_responsavel: true,
      arquivado: false,
    };

    // Na atualização, desconsidera o próprio registro sendo editado
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
