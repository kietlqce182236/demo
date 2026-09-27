import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SnackServiceEntity } from './snack-service.entity';

@Entity('snack_service_periods')
export class SnackServicePeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'snack_service_id', type: 'uuid' })
  snackServiceId: string;

  @Column({ name: 'period_code', type: 'varchar', length: 50 })
  periodCode: string;

  @Column({ name: 'applied_grades', type: 'text', array: true })
  appliedGrades: string[];

  @Column({ name: 'is_whole_school', type: 'boolean', default: false })
  isWholeSchool: boolean;

  @Column({ name: 'registration_start', type: 'date' })
  registrationStart: string;

  @Column({ name: 'registration_end', type: 'date' })
  registrationEnd: string;

  @Column({ name: 'service_months', type: 'text', array: true })
  serviceMonths: string[];

  @Column({ name: 'price_per_unit_per_day', type: 'decimal', precision: 12, scale: 2 })
  pricePerUnitPerDay: number;

  @Column({ name: 'auto_refund_enabled', type: 'boolean', default: false })
  autoRefundEnabled: boolean;

  @Column({ name: 'capacity_mode', type: 'varchar', length: 50, default: 'UNLIMITED' })
  capacityMode: string;

  @Column({ name: 'kitchen_capacity', type: 'int', nullable: true })
  kitchenCapacity: number;

  @Column({ name: 'total_quota', type: 'int', nullable: true })
  totalQuota: number;

  @Column({ name: 'quota_per_grade', type: 'jsonb', nullable: true })
  quotaPerGrade: Record<string, number>;

  @Column({ name: 'auto_close_enabled', type: 'boolean', default: false })
  autoCloseEnabled: boolean;

  @Column({ name: 'auto_close_threshold_percent', type: 'int', nullable: true })
  autoCloseThresholdPercent: number;

  @Column({ name: 'nutrition_notes', type: 'text', nullable: true })
  nutritionNotes: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'DRAFT' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SnackServiceEntity)
  @JoinColumn({ name: 'snack_service_id' })
  snackService: SnackServiceEntity;
}
