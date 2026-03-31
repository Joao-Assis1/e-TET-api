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
  IsBoolean,
  IsDateString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Family } from '../families/family.entity';

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

export enum SituacaoPeso {
  ADEQUADO = 'Adequado',
  ABAIXO = 'Abaixo',
  ACIMA = 'Acima',
}

@Entity('individuals')
export class Individual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Family, { nullable: false })
  @JoinColumn({ name: 'family_id' })
  family: Family;

  // Bloco 1: Identificação Básica
  @Column({ default: false })
  is_responsavel: boolean;

  @Column()
  possui_cartao_sus: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  cartao_sus: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  cpf: string;

  @Column()
  nome_completo: string;

  @Column({ type: 'varchar', nullable: true })
  nome_social: string;

  @Column({ type: 'date' })
  data_nascimento: Date;

  @Column({ type: 'varchar' })
  sexo: string;

  @Column({ type: 'varchar' })
  raca_cor: string;

  @Column({ type: 'varchar' })
  nacionalidade: string;

  @Column({ type: 'boolean', default: false })
  desempregado: boolean;

  @Column({ type: 'boolean', default: false })
  analfabeto: boolean;

  @Column({ type: 'varchar', nullable: true })
  parentesco: string | null;

  @Column({ type: 'varchar', nullable: true })
  escolaridade: string | null;

  @Column({ type: 'varchar', nullable: true })
  situacao_mercado_trabalho: string | null;

  @Column({ type: 'varchar', nullable: true })
  ocupacao: string | null;

  @Column({ type: 'varchar', nullable: true })
  orientacao_sexual: string | null;

  @Column({ type: 'varchar', nullable: true })
  identidade_genero: string | null;

  @Column({ type: 'varchar', nullable: true })
  etnia: string | null;

  // Bloco 2: Contato e Filiação
  @Column({ type: 'varchar', nullable: true })
  telefone_celular: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ default: false })
  nome_mae_desconhecido: boolean;

  @Column({ type: 'varchar', nullable: true })
  nome_mae: string;

  @Column({ default: false })
  nome_pai_desconhecido: boolean;

  @Column({ type: 'varchar', nullable: true })
  nome_pai: string;

  // Bloco 3: Condições de Saúde (Sentinelas)
  @Column()
  possui_deficiencia: boolean;

  @Column({ type: 'simple-array', nullable: true })
  deficiencias: string[];

  @Column({ type: 'boolean', nullable: true })
  internacao_12_meses: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  tria_inseguranca_alimentar: string | null;

  @Column({ type: 'boolean', nullable: true })
  gestante: boolean;

  @Column({ type: 'varchar', nullable: true })
  maternidade_referencia: string;

  @Column({ type: 'varchar' })
  situacao_peso: string;

  @Column()
  fumante: boolean;

  @Column()
  uso_alcool: boolean;

  @Column()
  uso_outras_drogas: boolean;

  @Column()
  hipertensao_arterial: boolean;

  @Column()
  diabetes: boolean;

  @Column()
  teve_avc_derrame: boolean;

  @Column()
  teve_infarto: boolean;

  @Column()
  doenca_cardiaca: boolean;

  @Column({ type: 'simple-array', nullable: true })
  doencas_cardiacas_quais: string[];

  @Column()
  problemas_rins: boolean;

  @Column({ type: 'simple-array', nullable: true })
  problemas_rins_quais: string[];

  @Column()
  doenca_respiratoria: boolean;

  @Column({ type: 'simple-array', nullable: true })
  doencas_respiratorias_quais: string[];

  @Column()
  tuberculose: boolean;

  @Column()
  hanseniase: boolean;

  @Column()
  teve_cancer: boolean;

  @Column()
  doenca_mental_psiquiatrica: boolean;

  @Column()
  acamado: boolean;

  @Column()
  domiciliado: boolean;

  @Column()
  usa_plantas_medicinais: boolean;

  // Auditoria
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  constructor(partial: Partial<Individual>) {
    Object.assign(this, partial);
  }
}

export class CreateIndividualDto {
  @IsUUID()
  family_id: string;

  @IsOptional()
  @IsBoolean()
  is_responsavel?: boolean;

  @IsBoolean()
  possui_cartao_sus: boolean;

  @ValidateIf((o) => o.possui_cartao_sus)
  @IsString()
  cartao_sus: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsString()
  nome_completo: string;

  @IsOptional()
  @IsString()
  nome_social?: string;

  @IsDateString()
  data_nascimento: string;

  @IsEnum(Sexo)
  sexo: Sexo;

  @IsEnum(RacaCor)
  raca_cor: RacaCor;

  @IsEnum(Nacionalidade)
  nacionalidade: Nacionalidade;

  @IsOptional()
  @IsBoolean()
  desempregado?: boolean;

  @IsOptional()
  @IsBoolean()
  analfabeto?: boolean;

  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsString()
  escolaridade?: string;

  @IsOptional()
  @IsString()
  situacao_mercado_trabalho?: string;

  @IsOptional()
  @IsString()
  ocupacao?: string;

  @IsOptional()
  @IsString()
  orientacao_sexual?: string;

  @IsOptional()
  @IsString()
  identidade_genero?: string;

  @IsOptional()
  @IsString()
  etnia?: string;

  @IsOptional()
  @IsString()
  telefone_celular?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  nome_mae_desconhecido?: boolean;

  @ValidateIf((o) => !o.nome_mae_desconhecido)
  @IsString()
  nome_mae: string;

  @IsOptional()
  @IsBoolean()
  nome_pai_desconhecido?: boolean;

  @IsOptional()
  @IsString()
  nome_pai?: string;

  @IsBoolean()
  possui_deficiencia: boolean;

  @ValidateIf((o) => o.possui_deficiencia)
  @IsArray()
  @IsString({ each: true })
  deficiencias: string[];

  @IsOptional()
  @IsBoolean()
  internacao_12_meses?: boolean;

  @IsOptional()
  @IsString()
  tria_inseguranca_alimentar?: string;

  @ValidateIf((o) => o.sexo === Sexo.FEMININO)
  @IsOptional()
  @IsBoolean()
  gestante?: boolean;

  @ValidateIf((o) => o.gestante)
  @IsString()
  @IsOptional()
  maternidade_referencia?: string;

  @IsEnum(SituacaoPeso)
  situacao_peso: SituacaoPeso;

  @IsBoolean()
  fumante: boolean;

  @IsBoolean()
  uso_alcool: boolean;

  @IsBoolean()
  uso_outras_drogas: boolean;

  @IsBoolean()
  hipertensao_arterial: boolean;

  @IsBoolean()
  diabetes: boolean;

  @IsBoolean()
  teve_avc_derrame: boolean;

  @IsBoolean()
  teve_infarto: boolean;

  @IsBoolean()
  doenca_cardiaca: boolean;

  @ValidateIf((o) => o.doenca_cardiaca)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  doencas_cardiacas_quais?: string[];

  @IsBoolean()
  problemas_rins: boolean;

  @ValidateIf((o) => o.problemas_rins)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  problemas_rins_quais?: string[];

  @IsBoolean()
  doenca_respiratoria: boolean;

  @ValidateIf((o) => o.doenca_respiratoria)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  doencas_respiratorias_quais?: string[];

  @IsBoolean()
  tuberculose: boolean;

  @IsBoolean()
  hanseniase: boolean;

  @IsBoolean()
  teve_cancer: boolean;

  @IsBoolean()
  doenca_mental_psiquiatrica: boolean;

  @IsBoolean()
  acamado: boolean;

  @IsBoolean()
  domiciliado: boolean;

  @IsBoolean()
  usa_plantas_medicinais: boolean;
}

export class UpdateIndividualDto extends PartialType(CreateIndividualDto) {}
