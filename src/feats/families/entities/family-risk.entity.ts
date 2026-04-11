import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Family } from '../family.entity';

@Entity('family_risks')
export class FamilyRiskStratification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'familyId' })
  familyId: string;

  @Column({ type: 'int', default: 0 }) bedriddenCount: number;
  @Column({ type: 'int', default: 0 }) physicalDisabilityCount: number;
  @Column({ type: 'int', default: 0 }) mentalDisabilityCount: number;
  @Column({ type: 'int', default: 0 }) severeMalnutritionCount: number;
  @Column({ type: 'int', default: 0 }) drugAddictionCount: number;
  @Column({ type: 'int', default: 0 }) unemployedCount: number;
  @Column({ type: 'int', default: 0 }) illiterateCount: number;
  @Column({ type: 'int', default: 0 }) under6MonthsCount: number;
  @Column({ type: 'int', default: 0 }) over70YearsCount: number;
  @Column({ type: 'int', default: 0 }) hypertensionCount: number;
  @Column({ type: 'int', default: 0 }) diabetesCount: number;

  @Column({ type: 'boolean', default: true }) basicSanitation: boolean;
  @Column({ type: 'int', default: 1 }) roomsCount: number;

  @Column({ type: 'int', nullable: true }) finalScore: number;
  @Column({ type: 'varchar', nullable: true }) riskClass: string;

  @Column() createdBy: string;
  @CreateDateColumn() createdAt: Date;
}
