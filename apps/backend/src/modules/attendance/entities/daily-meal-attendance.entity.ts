import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../database/base.entity';
import { ChildEntity } from './child.entity';
import { ClassEntity } from './class.entity';

@Entity({ name: 'daily_meal_attendance' })
export class DailyMealAttendanceEntity extends BaseTenantEntity {
  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate: string;

  @Column({ name: 'meal_type', type: 'varchar', length: 50 })
  mealType: string; // 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_SNACK' | 'EXTRA_SNACK'

  @Column({ name: 'attendance_status', type: 'varchar', length: 50, default: 'PRESENT' })
  attendanceStatus: string; // 'PRESENT' | 'ABSENT_PERMITTED' | 'ABSENT_UNPERMITTED' | 'NOT_REGISTERED'

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy: string;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;

  @Column({ name: 'checkin_source', type: 'varchar', length: 50, default: 'TEACHER_APP' })
  checkinSource: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'meal_session', type: 'varchar', length: 50, default: 'Bữa trưa chính' })
  mealSession: string;

  @Column({ name: 'dishes_served', type: 'text', nullable: true })
  dishesServed?: string;

  @Column({ name: 'dietary_badge_text', type: 'varchar', length: 255, nullable: true })
  dietaryBadgeText?: string;

  @Column({ name: 'dietary_badge_type', type: 'varchar', length: 50, nullable: true })
  dietaryBadgeType?: string;

  @Column({ name: 'teacher_name', type: 'varchar', length: 100, default: 'Cô Mai Anh' })
  teacherName: string;

  @Column({ name: 'parent_status_type', type: 'varchar', length: 50, default: 'VIEWED' })
  parentStatusType: string;

  @Column({ name: 'parent_status_label', type: 'varchar', length: 100, default: 'PH đã xem' })
  parentStatusLabel: string;

  @Column({ name: 'need_special_attention', type: 'boolean', default: false })
  needSpecialAttention: boolean;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt?: Date;

  @Column({ name: 'kitchen_status', type: 'varchar', length: 50, default: 'SYNCED' })
  kitchenStatus: string;

  @ManyToOne(() => ChildEntity, (child) => child.mealAttendances)
  @JoinColumn({ name: 'child_id' })
  child: ChildEntity;

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
