import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('growth_records')
export class GrowthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @Column({ type: 'date', name: 'measurement_date' })
  measurementDate: string;

  @Column({ type: 'int', name: 'age_in_months' })
  ageInMonths: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'weight_kg' })
  weightKg: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'height_cm' })
  heightCm: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  bmi: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  waz: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  haz: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  baz: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  whz: number;

  @Column({ type: 'varchar', length: 50, name: 'weight_classification' })
  weightClassification: string;

  @Column({ type: 'varchar', length: 50, name: 'height_classification' })
  heightClassification: string;

  @Column({ type: 'varchar', length: 50, name: 'bmi_classification' })
  bmiClassification: string;

  @Column({ type: 'varchar', length: 100, name: 'overall_nutritional_status' })
  overallNutritionalStatus: string;

  @Column({ type: 'uuid', name: 'measured_by' })
  measuredBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'measured_by' })
  measuredByUser: User;

  @Column({ type: 'text', name: 'health_notes', nullable: true })
  healthNotes: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
