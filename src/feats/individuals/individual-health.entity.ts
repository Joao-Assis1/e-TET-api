import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreetTime, MealsPerDay } from './individual.entity';
import { Individual } from './individual.entity';

@Entity('individual_health_conditions')
export class IndividualHealth {
  @ApiProperty({ example: 'uuid-das-condicoes' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bloco 4: Condições de Saúde (Sentinelas)
  @ApiProperty({ default: false })
  @Column({ default: false })
  gestante: boolean;

  @ApiPropertyOptional({ example: 'Maternidade Municipal' })
  @Column({ type: 'varchar', nullable: true })
  maternidade_referencia: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  acima_do_peso: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  fumante: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  uso_alcool: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  uso_outras_drogas: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  hipertensao_arterial: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  diabetes: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  teve_avc_derrame: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  teve_infarto: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  doenca_cardiaca: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  problemas_rins: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  doenca_respiratoria: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  tuberculose: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  hanseniase: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  teve_cancer: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  doenca_mental: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  acamado_domiciliado: boolean;

  // Bloco 5: Situação de Rua
  @ApiProperty({ default: false })
  @Column({ default: false })
  situacao_de_rua: boolean;

  @ApiPropertyOptional({ enum: StreetTime })
  @Column({ type: 'varchar', nullable: true })
  tempo_rua: StreetTime | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  recebe_beneficio: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  referencia_familiar: boolean;

  @ApiPropertyOptional({ enum: MealsPerDay })
  @Column({ type: 'varchar', nullable: true })
  refeicoes_dia: MealsPerDay | null;

  // Novos campos Sync V2
  @ApiProperty({ default: false })
  @Column({ default: false })
  teve_internacao_12_meses: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  causa_internacao: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  usa_plantas_medicinais: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  abaixo_do_peso: boolean;

  @OneToOne(() => Individual, (individual) => individual.healthConditions)
  individual: Individual;

  @ApiPropertyOptional()
  @CreateDateColumn({ nullable: true })
  created_at: Date;

  @ApiPropertyOptional()
  @UpdateDateColumn({ nullable: true })
  updated_at: Date;

  @ApiPropertyOptional()
  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
