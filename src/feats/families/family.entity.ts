import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsOptional,
  Min,
  IsBoolean,
  IsInt,
  IsUUID,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Household } from '../households/household.entity';

export enum FamilyIncome {
  AT_1_4_SM = 'Até 1/4 salário mínimo',
  DE_1_4_A_1_2_SM = 'De 1/4 a 1/2 salário mínimo',
  DE_1_2_A_1_SM = 'De 1/2 a 1 salário mínimo',
  DE_1_A_2_SM = 'De 1 a 2 salários mínimos',
  DE_2_A_3_SM = 'De 2 a 3 salários mínimos',
  DE_3_A_4_SM = 'De 3 a 4 salários mínimos',
  MAIOR_4_SM = 'Mais de 4 salários mínimos',
}

export enum FamilyRisk {
  R0 = 'Risco Baixo',
  R1 = 'Risco Menor',
  R2 = 'Risco Médio',
  R3 = 'Risco Máximo',
}

export enum FamilyStatus {
  RESIDENTE = 'Residente',
  MUDOU_SE = 'Mudou-se',
}

@Entity('families')
@Index(['created_at'])
@Index(['classificacao_risco'])
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero_prontuario: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  renda_familiar: FamilyIncome | null;

  @Column({ type: 'int', default: 0 })
  membros_declarados: number;

  @Column({ type: 'varchar', nullable: true })
  reside_desde: string;

  @Column({ type: 'int', nullable: true })
  pontuacao_risco: number;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  classificacao_risco: FamilyRisk | null;

  @Column({
    type: 'varchar',
    default: FamilyStatus.RESIDENTE,
  })
  status_mudanca: FamilyStatus;

  @Column({ type: 'boolean', default: false })
  saneamento_inadequado: boolean;

  @Column({ type: 'boolean', default: false })
  arquivada: boolean;

  @Column({ type: 'simple-json', nullable: true })
  historico_domicilios: string[];

  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  household_id: string | null;

  @ManyToOne(() => Household, (household) => household.families, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'household_id' })
  household: Household | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  constructor(partial: Partial<Family>) {
    Object.assign(this, partial);
  }
}

export class CreateFamilyDto {
  @ApiProperty({ example: 'PR-12345' })
  @IsString()
  @IsNotEmpty()
  numero_prontuario: string;

  @ApiPropertyOptional({ enum: FamilyIncome })
  @IsOptional()
  @IsEnum(FamilyIncome)
  renda_familiar?: FamilyIncome;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  membros_declarados: number;

  @ApiPropertyOptional({ example: '01/2020' })
  @IsOptional()
  @IsString()
  reside_desde?: string;

  @ApiPropertyOptional({ enum: FamilyRisk })
  @IsOptional()
  @IsEnum(FamilyRisk)
  classificacao_risco?: FamilyRisk;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  pontuacao_risco?: number;

  @ApiPropertyOptional({ enum: FamilyStatus, default: FamilyStatus.RESIDENTE })
  @IsOptional()
  @IsEnum(FamilyStatus)
  status_mudanca?: FamilyStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  saneamento_inadequado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  household_id?: string;
}

export class UpdateFamilyDto extends PartialType(CreateFamilyDto) {}
