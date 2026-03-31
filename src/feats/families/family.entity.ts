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
  Min,
  IsBoolean,
  IsInt,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Household } from '../households/household.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero_prontuario: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  renda_familiar: number;

  @Column({ type: 'int', default: 0 })
  numero_membros: number;

  @Column({ type: 'date' })
  reside_desde: Date;

  @Column({ type: 'int', nullable: true })
  pontuacao_risco: number;

  @Column({ type: 'varchar', nullable: true })
  classificacao_risco: string;

  @Column({ type: 'boolean', default: false })
  saneamento_inadequado: boolean;

  @ManyToOne(() => Household, (household) => household.families, {
    nullable: true,
  })
  @JoinColumn({ name: 'household_id' })
  household: Household;

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
  @IsString()
  numero_prontuario: string;

  @IsNumber()
  @Min(0)
  renda_familiar: number;

  @IsNumber()
  @Min(1)
  numero_membros: number;

  @IsDateString()
  reside_desde: string;

  @IsOptional()
  @IsBoolean()
  saneamento_inadequado?: boolean;

  @IsUUID()
  household_id: string;
}

export class UpdateFamilyDto extends PartialType(CreateFamilyDto) {}
