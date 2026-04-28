import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  ValidateIf,
  IsArray,
  IsEnum,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Family } from '../families/family.entity';
import { User } from '../users/user.entity';

export enum HousingSituation {
  PROPRIO = 'Próprio',
  ALUGADO = 'Alugado',
  ARRENDADO = 'Arrendado',
  CEDIDO = 'Cedido',
  OCUPACAO = 'Ocupação',
  SITUACAO_RUA = 'Situação de rua',
  OUTRA = 'Outra',
}

export enum HouseholdType {
  CASA = 'Casa',
  APARTAMENTO = 'Apartamento',
  COMODO = 'Cômodo',
  OUTRO = 'Outro',
}

export enum ConstructionMaterial {
  ALVENARIA_TIJOLO_COM_REVESTIMENTO = 'Alvenaria/Tijolo com revestimento',
  ALVENARIA_TIJOLO_SEM_REVESTIMENTO = 'Alvenaria/Tijolo sem revestimento',
  TAIPA_COM_REVESTIMENTO = 'Taipa com revestimento',
  TAIPA_SEM_REVESTIMENTO = 'Taipa sem revestimento',
  MADEIRA_APROPRIADA = 'Madeira apropriada para construção',
  MATERIAL_APROVEITADO = 'Material aproveitado (sucata)',
  PALHA = 'Palha',
  OUTRO = 'Outro',
}

export enum WaterSupply {
  REDE_ENCANADA = 'Rede encanada até o domicílio',
  POCO_OU_NASCENTE = 'Poço ou nascente no domicílio',
  CISTERNA = 'Cisterna',
  CARRO_PIPA = 'Carro-pipa',
  OUTRO = 'Outro',
}

export enum WaterTreatment {
  FILTRACAO = 'Filtração',
  FERVURA = 'Fervura',
  CLORACAO = 'Cloração',
  MINERAL = 'Mineral',
  SEM_TRATAMENTO = 'Sem tratamento',
}

export enum SewageDisposal {
  REDE_COLETORA = 'Rede coletora de esgoto ou pluvial',
  FOSSA_SEPTICA = 'Fossa séptica',
  FOSSA_RUDIMENTAR = 'Fossa rudimentar',
  DIRETO_PARA_RIO_LAGO_OU_MAR = 'Direto para rio, lago ou mar',
  CEU_ABERTO = 'Céu aberto',
  OUTRO = 'Outro',
}

export enum TrashDestination {
  COLETADO = 'Coletado',
  QUEIMADO_OU_ENTERRADO = 'Queimado ou enterrado no imóvel',
  CEU_ABERTO_OU_TERRENO_BALDIO = 'Céu aberto ou terreno baldio',
  OUTRO = 'Outro',
}

export enum HouseholdLocation {
  URBANA = 'Urbana',
  RURAL = 'Rural',
}

export enum HouseholdAccess {
  PAVIMENTADO = 'Pavimentado',
  CHAO_BATIDO = 'Chão batido',
  FLUVIAL = 'Fluvial',
  OUTRO = 'Outro',
}

export enum AnimalType {
  CACHORRO = 'Cachorro',
  GATO = 'Gato',
  PASSARO = 'Pássaro',
  CAVALOS_EQUINOS = 'Cavalos/Eqüinos',
  PORCO_SUINOS = 'Porco/Suínos',
  AVES = 'Aves',
  OUTRO = 'Outro',
}

@Entity('households')
@Index(['bairro'])
@Index(['created_at'])
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  cep: string | null;

  @Column({ type: 'varchar' })
  logradouro: string;

  @Column({ type: 'varchar' })
  numero: string;

  @Column({ type: 'varchar', nullable: true })
  complemento: string | null;

  @Column({ type: 'varchar' })
  bairro: string;

  @Column({ type: 'varchar', nullable: true })
  microarea: string | null;

  @Column({ type: 'varchar', nullable: true })
  ponto_referencia: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefone_residencial: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefone_contato: string | null;

  @Column({ type: 'varchar', nullable: true })
  coordenadas_gps: string | null;

  @Column({ type: 'boolean', default: false })
  recusa_cadastro: boolean;

  @Column({ nullable: true })
  data_ultima_visita: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  situacao_moradia: HousingSituation | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  localizacao: HouseholdLocation | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  tipo_domicilio: HouseholdType | null;

  @Column({ type: 'int', nullable: true })
  numero_moradores: number | null;

  @Column({ type: 'int', nullable: true })
  numero_comodos: number | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  material_construcao: ConstructionMaterial | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  tipo_acesso_domicilio: HouseholdAccess | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  abastecimento_agua: WaterSupply | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  agua_consumo: WaterTreatment | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  escoamento_banheiro: SewageDisposal | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  destino_lixo: TrashDestination | null;

  @Column({ type: 'boolean', default: false })
  energia_eletrica: boolean;

  @Column({ type: 'boolean' })
  possui_animais: boolean;

  @Column({ type: 'int', nullable: true })
  quantidade_animais: number | null;

  @Column({ type: 'simple-json', nullable: true })
  animais_quais: AnimalType[] | null;

  @OneToMany(() => Family, (family) => family.household)
  families: Family[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  constructor(partial: Partial<Household>) {
    Object.assign(this, partial);
  }
}

export class CreateHouseholdDto {
  @ApiPropertyOptional({ example: '12345-678' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({ example: 'Rua Principal' })
  @IsString()
  logradouro: string;

  @ApiProperty({ example: '100' })
  @IsString()
  numero: string;

  @ApiPropertyOptional({ example: 'Apartamento 2' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  bairro: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  microarea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ponto_referencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone_residencial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone_contato?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coordenadas_gps?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recusa_cadastro?: boolean;

  @ApiProperty({ enum: HousingSituation })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(HousingSituation)
  situacao_moradia: HousingSituation;

  @ApiProperty({ enum: HouseholdLocation })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(HouseholdLocation)
  localizacao: HouseholdLocation;

  @ApiProperty({ enum: HouseholdType })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(HouseholdType)
  tipo_domicilio: HouseholdType;

  @ApiProperty({ example: 4 })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsInt()
  numero_moradores: number;

  @ApiProperty({ example: 5 })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsInt()
  numero_comodos: number;

  @ApiProperty({ enum: ConstructionMaterial })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(ConstructionMaterial)
  material_construcao: ConstructionMaterial;

  @ApiPropertyOptional({ enum: HouseholdAccess })
  @IsOptional()
  @IsEnum(HouseholdAccess)
  tipo_acesso_domicilio?: HouseholdAccess;

  @ApiProperty({ enum: WaterSupply })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(WaterSupply)
  abastecimento_agua: WaterSupply;

  @ApiProperty({ enum: WaterTreatment })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(WaterTreatment)
  agua_consumo: WaterTreatment;

  @ApiProperty({ enum: SewageDisposal })
  @ValidateIf((o: CreateHouseholdDto) => !o.recusa_cadastro)
  @IsEnum(SewageDisposal)
  escoamento_banheiro: SewageDisposal;

  @ApiPropertyOptional({ enum: TrashDestination })
  @IsOptional()
  @IsEnum(TrashDestination)
  destino_lixo?: TrashDestination;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  energia_eletrica?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  possui_animais: boolean;

  @ApiPropertyOptional({ example: 0 })
  @ValidateIf((o: CreateHouseholdDto) => o.possui_animais === true)
  @IsInt()
  quantidade_animais?: number;

  @ApiPropertyOptional({ enum: AnimalType, isArray: true })
  @ValidateIf((o: CreateHouseholdDto) => o.possui_animais === true)
  @IsOptional()
  @IsArray()
  @IsEnum(AnimalType, { each: true })
  animais_quais?: AnimalType[];
}

export class UpdateHouseholdDto extends PartialType(CreateHouseholdDto) {}
