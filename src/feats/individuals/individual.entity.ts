import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IndividualHealth } from './individual-health.entity';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateIf,
  IsUUID,
  Min,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Family } from '../families/family.entity';
import { Household } from '../households/household.entity';

// --- ENUMS CDS ---

export enum Sexo {
  MASCULINO = 'Masculino',
  FEMININO = 'Feminino',
}

export enum RacaCor {
  BRANCA = 'Branca',
  PRETA = 'Preta',
  PARDA = 'Parda',
  AMARELA = 'Amarela',
  INDIGENA = 'Indígena',
}

export enum Nacionalidade {
  BRASILEIRA = 'Brasileira',
  NATURALIZADO = 'Naturalizado',
  ESTRANGEIRO = 'Estrangeiro',
}

export enum EducationLevel {
  CRECHE = 'Creche',
  PRE_ESCOLA = 'Pré-escola',
  EF1_A_4 = 'Ensino Fundamental 1ª a 4ª séries',
  EF5_A_8 = 'Ensino Fundamental 5ª a 8ª séries',
  EF_COMPLETO = 'Ensino Fundamental Completo',
  EM_INCOMPLETO = 'Ensino Médio Incompleto',
  EM_COMPLETO = 'Ensino Médio Completo',
  SUP_INCOMPLETO = 'Ensino Superior Incompleto',
  SUP_COMPLETO = 'Ensino Superior Completo',
  EJA_FUNDAMENTAL = 'EJA - Fundamental',
  EJA_MEDIO = 'EJA - Médio',
  ALFABETIZACAO = 'Alfabetização para Adultos',
  NENHUM = 'Nenhum',
}

export enum JobStatus {
  EMPREGADO_COM_CARTEIRA = 'Asalariado com carteira assinada',
  EMPREGADO_SEM_CARTEIRA = 'Asalariado sem carteira assinada',
  AUTONOMO_COM_PREV = 'Autônomo com contribuição previdenciária',
  AUTONOMO_SEM_PREV = 'Autônomo sem contribuição previdenciária',
  APOSENTADO = 'Aposentado/Pensionista',
  DESEMPREGADO = 'Desempregado',
  INFORMAL = 'Trabalho Informal',
  OUTRO = 'Outro',
}

export enum Kinship {
  CONJUGE = 'Cônjuge / Companheiro(a)',
  FILHO = 'Filho(a)',
  ENTEADO = 'Enteado(a)',
  PAI_MAE = 'Pai / Mãe',
  AGREGADO = 'Agregado(a)',
  IRMAO = 'Irmão / Irmã',
  OUTRO = 'Outro',
}

export enum DisabilityType {
  AUDITIVA = 'Auditiva',
  VISUAL = 'Visual',
  INTELECTUAL = 'Intelectual/Cognitiva',
  FISICA = 'Física',
  OUTRA = 'Outra',
}

export enum SexualOrientation {
  HETERO = 'Heterossexual',
  HOMO = 'Homossexual (Gay / Lésbica)',
  BI = 'Bissexual',
  OUTRO = 'Outro',
}

export enum GenderIdentity {
  TRAVESTI = 'Travesti',
  TRANSEX_M = 'Transexual Masculino',
  TRANSEX_F = 'Transexual Feminino',
  OUTRO = 'Outro',
}

export enum StreetTime {
  MENOS_6_MESES = 'Menos de 6 meses',
  DE_6_12_MESES = 'De 6 a 12 meses',
  DE_1_5_ANOS = 'De 1 a 5 anos',
  MAIS_5_ANOS = 'Mais de 5 anos',
}

export enum MealsPerDay {
  UMA = 'Uma',
  DUAS = 'Duas',
  TRES_OU_MAIS = 'Três ou mais',
}

export enum SituacaoPeso {
  ABAIXO = 'Abaixo',
  NORMAL = 'Normal',
  ACIMA = 'Acima',
}

// --- ENTITIES ---

@Entity('individuals')
@Index(['created_at'])
export class Individual {
  @ApiProperty({ example: 'uuid-do-individuo' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-da-familia' })
  @Column({ name: 'family_id', type: 'uuid' })
  family_id: string;

  @ManyToOne(() => Family, { nullable: false })
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @ApiPropertyOptional({ example: 'uuid-do-domicilio' })
  @Column({ name: 'household_id', type: 'uuid', nullable: true })
  household_id: string | null;

  @ManyToOne(() => Household, { nullable: true })
  @JoinColumn({ name: 'household_id' })
  household: Household | null;

  // Bloco 1: Identificação Básica
  @ApiProperty({ default: false })
  @Column({ default: false })
  recusa_cadastro: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  arquivado: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  motivo_saida: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  is_responsavel: boolean;

  @ApiPropertyOptional({ example: '700000000000001' })
  @Column({ type: 'varchar', nullable: true, unique: true })
  cartao_sus: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @Column({ type: 'varchar', nullable: true, unique: true })
  cpf: string;

  @ApiProperty({ example: 'João da Silva' })
  @Column()
  nome_completo: string;

  @ApiPropertyOptional({ example: 'Joãozinho' })
  @Column({ type: 'varchar', nullable: true })
  nome_social: string;

  @ApiProperty({ example: '1990-01-01' })
  @Column({ type: 'date' })
  data_nascimento: Date;

  @ApiProperty({ enum: Sexo })
  @Column({ type: 'varchar' })
  sexo: Sexo;

  @ApiProperty({ enum: RacaCor })
  @Column({ type: 'varchar' })
  raca_cor: RacaCor;

  @ApiProperty({ enum: Nacionalidade, default: Nacionalidade.BRASILEIRA })
  @Column({ type: 'varchar', default: Nacionalidade.BRASILEIRA })
  nacionalidade: Nacionalidade;

  @ApiPropertyOptional({ enum: Kinship })
  @Column({ type: 'varchar', nullable: true })
  parentesco: Kinship | null;

  // Bloco 2: Sociodemográfico 1
  @ApiPropertyOptional({ enum: EducationLevel })
  @Column({ type: 'varchar', nullable: true })
  escolaridade: EducationLevel | null;

  @ApiPropertyOptional({ enum: JobStatus })
  @Column({ type: 'varchar', nullable: true })
  situacao_mercado_trabalho: JobStatus | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  frequenta_escola: boolean;

  // Bloco 3: Sociodemográfico 2
  @ApiPropertyOptional({ enum: SexualOrientation })
  @Column({ type: 'varchar', nullable: true })
  orientacao_sexual: SexualOrientation | null;

  @ApiPropertyOptional({ enum: GenderIdentity })
  @Column({ type: 'varchar', nullable: true })
  identidade_genero: GenderIdentity | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  possui_deficiencia: boolean;

  @ApiPropertyOptional({ enum: DisabilityType, isArray: true })
  @Column({ type: 'simple-array', nullable: true })
  deficiencias: DisabilityType[];

  @ApiProperty({ default: false })
  @Column({ default: false })
  plano_saude: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  comunidade_tradicional: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  nome_comunidade: string;

  // Novos campos Sync V2
  @ApiPropertyOptional({ example: 'joao@email.com' })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: '(11) 98888-7777' })
  @Column({ type: 'varchar', nullable: true })
  telefone_celular: string | null;

  @ApiPropertyOptional({ example: 'Maria da Silva' })
  @Column({ type: 'varchar', nullable: true })
  nome_mae: string | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  nome_mae_desconhecido: boolean;

  @ApiPropertyOptional({ example: 'José da Silva' })
  @Column({ type: 'varchar', nullable: true })
  nome_pai: string | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  nome_pai_desconhecido: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  frequenta_cuidador_tradicional: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  participa_grupo_comunitario: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  possui_plano_saude: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  pertence_povo_tradicional: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  usa_outras_praticas: boolean;

  // Relacionamento OneToOne para as Condições de Saúde (Blocos 4 e 5)
  @ApiProperty({ type: () => IndividualHealth })
  @OneToOne(() => IndividualHealth, (health) => health.individual, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'health_conditions_id' })
  healthConditions: IndividualHealth;

  // Auditoria
  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;

  @ApiPropertyOptional()
  @DeleteDateColumn()
  deleted_at: Date;

  constructor(partial: Partial<Individual>) {
    Object.assign(this, partial);
  }
}

// --- DTOs ---

export class IndividualHealthDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  gestante?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maternidade_referencia?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acima_do_peso?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  fumante?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  uso_alcool?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  uso_outras_drogas?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hipertensao_arterial?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  diabetes?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  teve_avc_derrame?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  teve_infarto?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  doenca_cardiaca?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  problemas_rins?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  doenca_respiratoria?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tuberculose?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hanseniase?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  teve_cancer?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  doenca_mental?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acamado_domiciliado?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  situacao_de_rua?: boolean;

  @ApiPropertyOptional({ enum: StreetTime })
  @IsOptional()
  @IsEnum(StreetTime)
  tempo_rua?: StreetTime;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recebe_beneficio?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  referencia_familiar?: boolean;

  @ApiPropertyOptional({ enum: MealsPerDay })
  @IsOptional()
  @IsEnum(MealsPerDay)
  refeicoes_dia?: MealsPerDay;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  teve_internacao_12_meses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  causa_internacao?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  usa_plantas_medicinais?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  abaixo_do_peso?: boolean;
}

export class CreateIndividualDto {
  @ApiProperty({ example: 'uuid-familia' })
  @IsUUID()
  family_id: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recusa_cadastro?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_responsavel?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cartao_sus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ example: 'José da Silva' })
  @IsString()
  @IsNotEmpty()
  nome_completo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome_social?: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsString()
  data_nascimento: string;

  @ApiProperty({ enum: Sexo })
  @IsEnum(Sexo)
  sexo: Sexo;

  @ApiProperty({ enum: RacaCor })
  @IsEnum(RacaCor)
  raca_cor: RacaCor;

  @ApiProperty({ enum: Nacionalidade, default: Nacionalidade.BRASILEIRA })
  @IsEnum(Nacionalidade)
  nacionalidade: Nacionalidade;

  @ApiPropertyOptional({ enum: Kinship })
  @IsOptional()
  @IsEnum(Kinship)
  parentesco?: Kinship;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  escolaridade?: EducationLevel;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  situacao_mercado_trabalho?: JobStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  frequenta_escola?: boolean;

  @ApiPropertyOptional({ enum: SexualOrientation })
  @IsOptional()
  @IsEnum(SexualOrientation)
  orientacao_sexual?: SexualOrientation;

  @ApiPropertyOptional({ enum: GenderIdentity })
  @IsOptional()
  @IsEnum(GenderIdentity)
  identidade_genero?: GenderIdentity;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  possui_deficiencia?: boolean;

  @ApiPropertyOptional({ enum: DisabilityType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DisabilityType, { each: true })
  deficiencias?: DisabilityType[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  plano_saude?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  comunidade_tradicional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome_comunidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone_celular?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome_mae?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  nome_mae_desconhecido?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome_pai?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  nome_pai_desconhecido?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  frequenta_cuidador_tradicional?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  participa_grupo_comunitario?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  possui_plano_saude?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pertence_povo_tradicional?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  usa_outras_praticas?: boolean;

  @ApiProperty({ type: IndividualHealthDto })
  @ValidateIf((o) => !o.recusa_cadastro)
  @Type(() => IndividualHealthDto)
  healthConditions: IndividualHealthDto;
}

export class UpdateIndividualDto extends PartialType(CreateIndividualDto) {}
