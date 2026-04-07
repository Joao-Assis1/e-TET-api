import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Family, CreateFamilyDto, UpdateFamilyDto, FamilyStatus, FamilyIncome } from './family.entity';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const SQLITE_UNIQUE_VIOLATION_CODE = 'SQLITE_CONSTRAINT_UNIQUE';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createFamilyDto: CreateFamilyDto): Promise<Family> {
    try {
      const { household_id, ...rest } = createFamilyDto;
      const family = new Family({
        ...rest,
        reside_desde: createFamilyDto.reside_desde,
        household: household_id ? ({ id: household_id } as any) : null,
      });
      return await this.familyRepository.save(family);
    } catch (error) {
      console.error('SAVE FAMILY ERROR DUMP:', error);
      if (
        error.code === SQLITE_UNIQUE_VIOLATION_CODE ||
        error.code === POSTGRES_UNIQUE_VIOLATION_CODE
      ) {
        throw new BadRequestException('Número de prontuário já existe.');
      }
      throw new InternalServerErrorException('Erro ao criar família.');
    }
  }

  async findAll(): Promise<Family[]> {
    return this.familyRepository.find();
  }

  async findOne(id: string): Promise<Family> {
    const family = await this.familyRepository.findOne({ where: { id } });
    if (!family) {
      throw new NotFoundException(`Família com ID ${id} não encontrada`);
    }
    return family;
  }

  async update(id: string, updateFamilyDto: UpdateFamilyDto): Promise<Family> {
    const family = await this.findOne(id);
    const { household_id, ...rest } = updateFamilyDto;

    // Muta o objeto gerenciado pelo TypeORM — garante UPDATE ao invés de INSERT
    Object.assign(family, rest);

    if (household_id !== undefined) {
      family.household = household_id ? ({ id: household_id } as any) : null;
    }

    if (updateFamilyDto.reside_desde !== undefined) {
      family.reside_desde = updateFamilyDto.reside_desde;
    }

    try {
      return await this.familyRepository.save(family);
    } catch (error) {
      if (
        error.code === SQLITE_UNIQUE_VIOLATION_CODE ||
        error.code === POSTGRES_UNIQUE_VIOLATION_CODE
      ) {
        throw new BadRequestException('Número de prontuário já existe.');
      }
      throw new InternalServerErrorException('Erro ao atualizar família.');
    }
  }

  async remove(id: string): Promise<void> {
    const family = await this.findOne(id);
    await this.familyRepository.softRemove(family);
  }

  /**
   * Exemplo de transação com Pessimistic Locking para prevenir Race Conditions.
   */
  async syncFamilyData(id: string, newIncome: FamilyIncome): Promise<Family> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Bloqueio pessimista para escrita (FOR UPDATE) previne leituras e escritas concorrentes
      const family = await queryRunner.manager.findOne(Family, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!family) {
        throw new NotFoundException(
          `Família com ID ${id} não encontrada para sincronização`,
        );
      }

      family.renda_familiar = newIncome;

      const updatedFamily = await queryRunner.manager.save(family);

      await queryRunner.commitTransaction();
      return updatedFamily;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao sincronizar dados da família: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      await queryRunner.release();
    }
  }

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
    
    // TypeORM supports unlinking by setting to null
    family.household = null;
    family.status_mudanca = FamilyStatus.MUDOU_SE;
    family.arquivada = true;

    try {
      return await this.familyRepository.save(family);
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao processar arquivamento/mudança de família.',
      );
    }
  }
}
