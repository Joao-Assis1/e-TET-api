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
} from 'typeorm';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  ValidateIf,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Family } from '../families/family.entity';
import { User } from '../users/user.entity';

@Entity('households')
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
  telefone_residencial: string | null;

  @Column({ type: 'varchar', nullable: true })
  coordenadas_gps: string | null;

  @Column({ type: 'varchar' })
  situacao_moradia: string;

  @Column({ type: 'varchar' })
  localizacao: string;

  @Column({ type: 'varchar' })
  tipo_domicilio: string;

  @Column({ type: 'int' })
  numero_moradores: number;

  @Column({ type: 'int' })
  numero_comodos: number;

  @Column({ type: 'varchar' })
  material_construcao: string;

  @Column({ type: 'varchar', nullable: true })
  tipo_acesso_domicilio: string | null;

  @Column({ type: 'varchar' })
  abastecimento_agua: string;

  @Column({ type: 'varchar' })
  agua_consumo: string;

  @Column({ type: 'varchar' })
  escoamento_banheiro: string;

  @Column({ type: 'varchar', nullable: true })
  destino_lixo: string | null;

  @Column({ type: 'boolean', default: false })
  energia_eletrica: boolean;

  @Column({ type: 'boolean' })
  possui_animais: boolean;

  @Column({ type: 'int', nullable: true })
  quantidade_animais: number | null;

  @Column({ type: 'simple-json', nullable: true })
  animais_quais: string[] | null;

  @OneToMany(() => Family, (family) => family.household)
  families: Family[];

  @Column({ type: 'varchar', nullable: true })
  cns_profissional: string | null;

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
  telefone_residencial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coordenadas_gps?: string;

  @ApiProperty({ example: 'Próprio' })
  @IsString()
  situacao_moradia: string;

  @ApiProperty({ example: 'Urbana' })
  @IsString()
  localizacao: string;

  @ApiProperty({ example: 'Casa' })
  @IsString()
  tipo_domicilio: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  numero_moradores: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  numero_comodos: number;

  @ApiProperty({ example: 'Alvenaria/Tijolo com revestimento' })
  @IsString()
  material_construcao: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipo_acesso_domicilio?: string;

  @ApiProperty({ example: 'Rede encanada até o domicílio' })
  @IsString()
  abastecimento_agua: string;

  @ApiProperty({ example: 'Filtrada' })
  @IsString()
  agua_consumo: string;

  @ApiProperty({ example: 'Rede coletora de esgoto ou pluvial' })
  @IsString()
  escoamento_banheiro: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destino_lixo?: string;

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

  @ApiPropertyOptional({ example: [] })
  @ValidateIf((o: CreateHouseholdDto) => o.possui_animais === true)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  animais_quais?: string[];
}

export class UpdateHouseholdDto extends PartialType(CreateHouseholdDto) {}
