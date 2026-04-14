import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { StreetTime, MealsPerDay } from './individual.entity';
import { Individual } from './individual.entity';

@Entity('individual_health_conditions')
export class IndividualHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Bloco 4: Condições de Saúde (Sentinelas)
  @Column({ default: false })
  gestante: boolean;

  @Column({ type: 'varchar', nullable: true })
  maternidade_referencia: string;

  @Column({ default: false })
  acima_do_peso: boolean;

  @Column({ default: false })
  fumante: boolean;

  @Column({ default: false })
  uso_alcool: boolean;

  @Column({ default: false })
  uso_outras_drogas: boolean;

  @Column({ default: false })
  hipertensao_arterial: boolean;

  @Column({ default: false })
  diabetes: boolean;

  @Column({ default: false })
  teve_avc_derrame: boolean;

  @Column({ default: false })
  teve_infarto: boolean;

  @Column({ default: false })
  doenca_cardiaca: boolean;

  @Column({ default: false })
  problemas_rins: boolean;

  @Column({ default: false })
  doenca_respiratoria: boolean;

  @Column({ default: false })
  tuberculose: boolean;

  @Column({ default: false })
  hanseniase: boolean;

  @Column({ default: false })
  teve_cancer: boolean;

  @Column({ default: false })
  doenca_mental: boolean;

  @Column({ default: false })
  acamado_domiciliado: boolean;

  // Bloco 5: Situação de Rua
  @Column({ default: false })
  situacao_de_rua: boolean;

  @Column({ type: 'varchar', nullable: true })
  tempo_rua: StreetTime | null;

  @Column({ default: false })
  recebe_beneficio: boolean;

  @Column({ default: false })
  referencia_familiar: boolean;

  @Column({ type: 'varchar', nullable: true })
  refeicoes_dia: MealsPerDay | null;

  // Novos campos Sync V2
  @Column({ default: false })
  teve_internacao_12_meses: boolean;

  @Column({ type: 'varchar', nullable: true })
  causa_internacao: string;

  @Column({ default: false })
  usa_plantas_medicinais: boolean;

  @Column({ default: false })
  abaixo_do_peso: boolean;

  @OneToOne(() => Individual, (individual) => individual.healthConditions)
  individual: Individual;
}
