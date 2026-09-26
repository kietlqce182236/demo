import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InspectionSampleItem } from './inspection-sample-item.entity';

export enum InspectionStatus {
  PENDING = 'Chưa hoàn tất',
  COMPLETED = 'Hoàn tất',
  WARNING = 'Có cảnh báo'
}

export enum StepStatus {
  PENDING = 'Chờ xử lý',
  PASSED = 'Đạt chuẩn',
  FAILED = 'Không đạt',
  SEALED = 'Đã lưu mẫu', // Used for step 3
  DISPOSED = 'Đã hủy mẫu an toàn' // Used for step 3
}

@Entity('inspection_records')
export class InspectionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'meal_date', type: 'date' })
  mealDate: string;

  @Column({ name: 'meal_time', type: 'varchar', length: 50 })
  mealTime: string;

  @Column({ name: 'total_portions', type: 'int', default: 0 })
  totalPortions: number;

  @Column({ name: 'performer_id', type: 'uuid', nullable: true })
  performerId: string;

  @Column({ name: 'performer_name', type: 'varchar', length: 255, nullable: true })
  performerName: string;
  
  @Column({ name: 'performer_role', type: 'varchar', length: 100, nullable: true })
  performerRole: string;

  @Column({ type: 'varchar', length: 50, default: InspectionStatus.PENDING })
  status: string;

  @Column({ name: 'step1_status', type: 'varchar', length: 50, default: StepStatus.PENDING })
  step1Status: string;
  @Column({ name: 'step1_time', type: 'timestamptz', nullable: true })
  step1Time: Date;
  @Column({ name: 'step1_note', type: 'text', nullable: true })
  step1Note: string;
  @Column({ name: 'step1_photo_url', type: 'text', nullable: true })
  step1PhotoUrl: string;

  @Column({ name: 'step2_status', type: 'varchar', length: 50, default: StepStatus.PENDING })
  step2Status: string;
  @Column({ name: 'step2_time', type: 'timestamptz', nullable: true })
  step2Time: Date;
  @Column({ name: 'step2_note', type: 'text', nullable: true })
  step2Note: string;
  @Column({ name: 'step2_photo_url', type: 'text', nullable: true })
  step2PhotoUrl: string;

  @Column({ name: 'step3_status', type: 'varchar', length: 50, default: StepStatus.PENDING })
  step3Status: string;
  @Column({ name: 'step3_note', type: 'text', nullable: true })
  step3Note: string;
  @Column({ name: 'step3_photo_url', type: 'text', nullable: true })
  step3PhotoUrl: string;
  @Column({ name: 'sealed_at', type: 'timestamptz', nullable: true })
  sealedAt: Date;
  @Column({ name: 'disposed_at', type: 'timestamptz', nullable: true })
  disposedAt: Date;
  @Column({ name: 'storage_temp', type: 'numeric', precision: 4, scale: 1, nullable: true })
  storageTemp: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => InspectionSampleItem, item => item.inspectionRecord, { cascade: true })
  sampleItems: InspectionSampleItem[];
}
