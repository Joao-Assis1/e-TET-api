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
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';

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

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Household, { nullable: false })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => Individual, { nullable: true })
  @JoinColumn({ name: 'individual_id' })
  individual: Individual | null;

  @Column({ type: 'varchar' })
  desfecho: string;

  @Column({ type: 'simple-array', nullable: true })
  motivo: string[];

  @Column({ type: 'simple-array', nullable: true })
  tipo_acompanhamento: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  altura: number | null;

  @Column({ type: 'date' })
  data_visita: Date;

  @Column({ type: 'varchar' })
  turno: string;

  @Column({ type: 'varchar', nullable: true })
  cns_profissional: string | null;

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

export class CreateVisitDto {
  @IsUUID()
  household_id: string;

  @IsOptional()
  @IsUUID()
  individual_id?: string;

  @IsEnum(DesfechoVisita)
  desfecho: DesfechoVisita;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  motivo?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tipo_acompanhamento?: string[];

  @IsOptional()
  @IsNumber()
  peso?: number;

  @IsOptional()
  @IsNumber()
  altura?: number;

  @IsDateString()
  data_visita: string;

  @IsEnum(TurnoVisita)
  turno: TurnoVisita;

  @IsOptional()
  @IsString()
  cns_profissional?: string;
}

export class UpdateVisitDto extends PartialType(CreateVisitDto) {}
