import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { ChildEntity } from './child.entity';
import { ClassEntity } from './class.entity';

@Entity({ name: 'meal_coordination_notes' })
export class MealCoordinationNoteEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'child_id', type: 'uuid', nullable: true })
  childId?: string;

  @Column({ name: 'meal_date', type: 'date' })
  mealDate: string;

  @Column({ name: 'meal_session', type: 'varchar', length: 50, default: 'LUNCH' })
  mealSession: string; // 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_SNACK' | 'ALL_DAY'

  @Column({ name: 'meal_session_label', type: 'varchar', length: 100, default: 'Bữa trưa chính' })
  mealSessionLabel: string;

  @Column({ name: 'note_type', type: 'varchar', length: 50, default: 'PORTION_ADJUSTMENT' })
  noteType: string;

  @Column({ name: 'note_type_label', type: 'varchar', length: 100, default: 'Điều chỉnh khẩu phần' })
  noteTypeLabel: string;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  priority: string; // 'URGENT' | 'HIGH' | 'NORMAL'

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // 'PENDING' | 'ACKNOWLEDGED' | 'PROCESSING' | 'RESOLVED' | 'CANCELLED'

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId?: string;

  @Column({ name: 'teacher_name', type: 'varchar', length: 100, default: 'Cô Nguyễn Lan Anh' })
  teacherName: string;

  @Column({ name: 'target_role', type: 'varchar', length: 50, default: 'KITCHEN' })
  targetRole: string;

  @Column({ name: 'target_role_label', type: 'varchar', length: 100, default: 'Bếp Bán Trú' })
  targetRoleLabel: string;

  @Column({ name: 'kitchen_acknowledged', type: 'boolean', default: false })
  kitchenAcknowledged: boolean;

  @Column({ name: 'kitchen_acknowledged_by', type: 'varchar', length: 100, nullable: true })
  kitchenAcknowledgedBy?: string;

  @Column({ name: 'kitchen_acknowledged_at', type: 'timestamptz', nullable: true })
  kitchenAcknowledgedAt?: Date;

  @Column({ name: 'kitchen_response', type: 'text', nullable: true })
  kitchenResponse?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  photos: string[];

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class?: ClassEntity;

  @ManyToOne(() => ChildEntity)
  @JoinColumn({ name: 'child_id' })
  child?: ChildEntity;
}
