import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateIf,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';

// --- ENUMS ---

export enum DesfechoVisita {
  REALIZADA = 'Realizada',
  RECUSA = 'Recusa',
  AUSENTE = 'Ausente',
}

export enum TurnoVisita {
  MANHA = 'Manhã',
  TARDE = 'Tarde',
  NOITE = 'Noite',
}

export enum FollowUpReason {
  GESTANTE = 'Gestante',
  PUERPERA = 'Puérpera',
  RECEM_NASCIDO = 'Recém-Nascido',
  CRIANCA = 'Criança',
  DESNUTRICAO = 'Desnutrição',
  REABILITACAO_DEFICIENCIA = 'Reabilitação / Deficiência',
  HIPERTENSAO = 'Hipertensão',
  DIABETES = 'Diabetes',
  ASMA = 'Asma',
  DPOC = 'DPOC / Enfizema',
  TUBERCULOSE = 'Tuberculose',
  HANSENIASE = 'Hanseníase',
  CANCER = 'Câncer',
  DOENCA_MENTAL = 'Doença Mental / Saúde Mental',
  ACAMADO = 'Acamado',
  VULNERABILIDADE_SOCIAL = 'Vulnerabilidade Social',
  BOLSA_FAMILIA = 'Condicionalidades do Bolsa Família',
  OUTROS = 'Outros',
}

export enum ActiveSearchReason {
  CONSULTA = 'Consulta',
  EXAME = 'Exame',
  VACINA = 'Vacina',
  BOLSA_FAMILIA = 'Bolsa Família',
  OUTROS = 'Outros',
}

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relações Polimórficas (Opcionais)
  @ManyToOne(() => Household, { nullable: true })
  @JoinColumn({ name: 'household_id' })
  household: Household | null;

  @ManyToOne(() => Family, { nullable: true })
  @JoinColumn({ name: 'family_id' })
  family: Family | null;

  @ManyToOne(() => Individual, { nullable: true })
  @JoinColumn({ name: 'individual_id' })
  individual: Individual | null;

  // Desfecho
  @Column({ type: 'boolean', default: false })
  visita_realizada: boolean;

  @Column({ type: 'varchar', nullable: true })
  desfecho: DesfechoVisita | null;

  @Column({ type: 'boolean', default: false })
  acompanhada_por_outro_profissional: boolean;

  // Temas / Acompanhamento
  @Column({ type: 'simple-array', nullable: true })
  motivo: FollowUpReason[];

  @Column({ type: 'simple-array', nullable: true })
  motivo_busca_ativa: ActiveSearchReason[];

  // Antropometria (Para Individual)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  altura: number | null;

  // Controle Ambiental / Vetorial (Para Imóvel ou Família)
  @Column({ type: 'boolean', default: false })
  imovel_foco: boolean;

  @Column({ type: 'boolean', default: false })
  acao_educativa: boolean;

  @Column({ type: 'boolean', default: false })
  tratamento_focal: boolean;

  @Column({ type: 'boolean', default: false })
  inspecao_armadilha: boolean;

  @Column({ type: 'boolean', default: false })
  registro_mecanico: boolean;

  // Geral
  @Column({ type: 'date' })
  data_visita: Date;

  @Column({ type: 'varchar' })
  turno: TurnoVisita;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  constructor(partial: Partial<Visit>) {
    Object.assign(this, partial);
  }
}

// --- DTOs ---

export class CreateVisitDto {
  @ApiPropertyOptional({ description: 'ID do Imóvel' })
  @IsOptional()
  @IsUUID()
  household_id?: string;

  @ApiPropertyOptional({ description: 'ID da Família' })
  @IsOptional()
  @IsUUID()
  family_id?: string;

  @ApiPropertyOptional({ description: 'ID do Cidadão' })
  @IsOptional()
  @IsUUID()
  individual_id?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  visita_realizada: boolean;

  @ApiPropertyOptional({ enum: DesfechoVisita })
  @ValidateIf((o) => !o.visita_realizada)
  @IsEnum(DesfechoVisita)
  @IsNotEmpty()
  desfecho?: DesfechoVisita;

  @ApiProperty({ example: false })
  @IsBoolean()
  acompanhada_por_outro_profissional: boolean;

  // Motivos de Acompanhamento / Busca Ativa
  @ApiPropertyOptional({ enum: FollowUpReason, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(FollowUpReason, { each: true })
  motivo?: FollowUpReason[];

  @ApiPropertyOptional({ enum: ActiveSearchReason, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ActiveSearchReason, { each: true })
  motivo_busca_ativa?: ActiveSearchReason[];

  // Antropometria (Válido apenas quando informado Individual)
  @ApiPropertyOptional()
  @ValidateIf((o) => !!o.individual_id)
  @IsOptional()
  @IsNumber()
  peso?: number;

  @ApiPropertyOptional()
  @ValidateIf((o) => !!o.individual_id)
  @IsOptional()
  @IsNumber()
  altura?: number;

  // Controle Ambiental (Válido para Imóvel ou Família)
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  imovel_foco?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acao_educativa?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tratamento_focal?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  inspecao_armadilha?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  registro_mecanico?: boolean;

  // Auditoria
  @ApiProperty({ example: '2024-03-20' })
  @IsDateString()
  data_visita: string;

  @ApiProperty({ enum: TurnoVisita })
  @IsEnum(TurnoVisita)
  turno: TurnoVisita;
}

export class UpdateVisitDto extends PartialType(CreateVisitDto) {}
