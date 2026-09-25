import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../database/base.entity';
import { DailyMealAttendanceEntity } from './daily-meal-attendance.entity';

@Entity({ name: 'meal_consumption_status' })
export class MealConsumptionStatusEntity extends BaseTenantEntity {
  @Column({ name: 'attendance_id', type: 'uuid' })
  attendanceId: string;

  @Column({ name: 'menu_dish_id', type: 'uuid', nullable: true })
  menuDishId?: string;

  @Column({ name: 'portion_consumed', type: 'varchar', length: 50, default: 'ALL' })
  portionConsumed: string; // 'ALL' | 'HALF' | 'QUARTER' | 'NONE' | 'DOUBLE_PORTION'

  @Column({ name: 'consumption_percentage', type: 'int', default: 100 })
  consumptionPercentage: number; // 100, 50, 20, 0

  @Column({ name: 'water_intake', type: 'varchar', length: 100, default: '200ml Nước ấm' })
  waterIntake: string;

  @Column({ name: 'sync_status', type: 'varchar', length: 50, default: 'SENT' })
  syncStatus: string; // 'SENT' | 'PENDING' | 'URGENT_PARENT'

  @Column({ name: 'sent_at', type: 'varchar', length: 50, nullable: true })
  sentAt?: string;

  @Column({ name: 'adverse_reaction_observed', type: 'boolean', default: false })
  adverseReactionObserved: boolean;

  @Column({ name: 'reaction_description', type: 'text', nullable: true })
  reactionDescription?: string;

  @Column({ name: 'teacher_feedback', type: 'text', nullable: true })
  teacherFeedback?: string;

  @Column({ name: 'photo_evidence_url', type: 'text', nullable: true })
  photoEvidenceUrl?: string;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;

  @ManyToOne(() => DailyMealAttendanceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendance_id' })
  attendance: DailyMealAttendanceEntity;
}
