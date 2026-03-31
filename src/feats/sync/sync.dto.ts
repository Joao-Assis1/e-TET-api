import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsBoolean,
  IsArray,
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { CreateFamilyDto } from '../families/family.entity';
import {
  CreateIndividualDto,
  Sexo,
  RacaCor,
  Nacionalidade,
  SituacaoPeso,
} from '../individuals/individual.entity';

export class SyncFamilyDataDto extends CreateFamilyDto {}

// Omit family_id from CreateIndividualDto for sync payload because it will be inferred
// We extend the base properties we need. Since CreateIndividualDto might have strict family_id validation,
// we recreate a type that allows it to be optional or we use OmitType. For simplicity and self-containment:
export class SyncIndividualDataDto {
  @IsOptional()
  @IsString()
  id?: string; // Para identificar se é atualização

  @IsBoolean()
  @IsOptional()
  desempregado?: boolean;

  @IsBoolean()
  @IsOptional()
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
  @IsBoolean()
  internacao_12_meses?: boolean;

  @IsOptional()
  @IsString()
  tria_inseguranca_alimentar?: string;

  // Propriedades essenciais do Indivíduo (Baseado na entidade original)
  @IsOptional()
  @IsBoolean()
  is_responsavel?: boolean;

  @IsBoolean()
  possui_cartao_sus: boolean;

  @ValidateIf((o) => o.possui_cartao_sus)
  @IsString()
  @IsOptional()
  cartao_sus?: string;

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

  @IsBoolean()
  possui_deficiencia: boolean;

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

  @IsBoolean()
  problemas_rins: boolean;

  @IsBoolean()
  doenca_respiratoria: boolean;

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

export class SyncFamilyPayloadDto {
  @ValidateNested()
  @Type(() => SyncFamilyDataDto)
  family: SyncFamilyDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncIndividualDataDto)
  individuals: SyncIndividualDataDto[];
}
