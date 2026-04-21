import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { CreateFamilyDto } from '../families/family.entity';
import { CreateHouseholdDto } from '../households/household.entity';
import { CreateVisitDto } from '../visits/visit.entity';
import {
  Sexo,
  RacaCor,
  Nacionalidade,
  IndividualHealthDto,
  EducationLevel,
  JobStatus,
  Kinship,
  SexualOrientation,
  GenderIdentity,
  DisabilityType,
} from '../individuals/individual.entity';

import { PartialType } from '@nestjs/mapped-types';

export class SyncHouseholdDataDto extends PartialType(CreateHouseholdDto) {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  _tempId?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class SyncFamilyDataDto extends PartialType(CreateFamilyDto) {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  _tempId?: string;

  @IsOptional()
  @IsUUID()
  household_id?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class SyncVisitDataDto extends PartialType(CreateVisitDto) {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  _tempId?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class SyncIndividualDataDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  _tempId?: string;

  @IsOptional()
  @IsUUID()
  family_id?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsBoolean()
  is_responsavel?: boolean;

  @IsOptional()
  @IsString()
  cartao_sus?: string;

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
  @IsEnum(Kinship)
  parentesco?: Kinship;

  @IsOptional()
  @IsEnum(EducationLevel)
  escolaridade?: EducationLevel;

  @IsOptional()
  @IsEnum(JobStatus)
  situacao_mercado_trabalho?: JobStatus;

  @IsOptional()
  @IsBoolean()
  frequenta_escola?: boolean;

  @IsOptional()
  @IsEnum(SexualOrientation)
  orientacao_sexual?: SexualOrientation;

  @IsOptional()
  @IsEnum(GenderIdentity)
  identidade_genero?: GenderIdentity;

  @IsOptional()
  @IsBoolean()
  possui_deficiencia?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(DisabilityType, { each: true })
  deficiencias?: DisabilityType[];

  @IsOptional()
  @IsBoolean()
  plano_saude?: boolean;

  @IsOptional()
  @IsBoolean()
  comunidade_tradicional?: boolean;

  @IsOptional()
  @IsString()
  nome_comunidade?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefone_celular?: string;

  @IsOptional()
  @IsString()
  nome_mae?: string;

  @IsOptional()
  @IsBoolean()
  nome_mae_desconhecido?: boolean;

  @IsOptional()
  @IsString()
  nome_pai?: string;

  @IsOptional()
  @IsBoolean()
  nome_pai_desconhecido?: boolean;

  @IsOptional()
  @IsBoolean()
  frequenta_cuidador_tradicional?: boolean;

  @IsOptional()
  @IsBoolean()
  participa_grupo_comunitario?: boolean;

  @IsOptional()
  @IsBoolean()
  possui_plano_saude?: boolean;

  @IsOptional()
  @IsBoolean()
  pertence_povo_tradicional?: boolean;

  @IsOptional()
  @IsBoolean()
  usa_outras_praticas?: boolean;

  @Type(() => IndividualHealthDto)
  healthConditions: IndividualHealthDto;
}

export class SyncBatchPayloadDto {
  @IsOptional()
  @IsArray()
  @Type(() => SyncHouseholdDataDto)
  households?: SyncHouseholdDataDto[];

  @IsOptional()
  @IsArray()
  @Type(() => SyncFamilyDataDto)
  families?: SyncFamilyDataDto[];

  @IsOptional()
  @IsArray()
  @Type(() => SyncIndividualDataDto)
  individuals?: SyncIndividualDataDto[];

  @IsOptional()
  @IsArray()
  @Type(() => SyncVisitDataDto)
  visits?: SyncVisitDataDto[];
}
