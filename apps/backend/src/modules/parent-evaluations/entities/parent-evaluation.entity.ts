import { Entity, Column } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';

@Entity({ name: 'parent_feedbacks' })
export class ParentEvaluationEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'parent_id', type: 'uuid' })
  parentId: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'feedback_date', type: 'date' })
  feedbackDate: string;

  @Column({ name: 'meal_type', type: 'varchar', length: 50, default: 'LUNCH' })
  mealType: string;

  @Column({ name: 'meal_title', type: 'varchar', length: 255, nullable: true })
  mealTitle?: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string;

  @Column({ name: 'status_label', type: 'varchar', length: 100, nullable: true })
  statusLabel?: string;

  @Column({ name: 'parent_relation', type: 'varchar', length: 50, default: 'Mẹ' })
  parentRelation: string;

  @Column({ name: 'parent_name_custom', type: 'varchar', length: 255, nullable: true })
  parentNameCustom?: string;

  @Column({ name: 'child_name_custom', type: 'varchar', length: 255, nullable: true })
  childNameCustom?: string;

  @Column({ name: 'class_name_custom', type: 'varchar', length: 100, nullable: true })
  classNameCustom?: string;

  @Column({ name: 'grade_level_custom', type: 'varchar', length: 50, nullable: true })
  gradeLevelCustom?: string;

  @Column({ name: 'feedback_time_label', type: 'varchar', length: 100, nullable: true })
  feedbackTimeLabel?: string;

  @Column({ name: 'priority_note', type: 'varchar', length: 255, nullable: true })
  priorityNote?: string;

  @Column({ name: 'likes_info', type: 'varchar', length: 255, nullable: true })
  likesInfo?: string;

  @Column({ type: 'text', array: true, nullable: true })
  photos?: string[];

  @Column({ name: 'photo_details', type: 'jsonb', nullable: true })
  photoDetails?: any;

  @Column({ name: 'response_content', type: 'text', nullable: true })
  responseContent?: string;

  @Column({ name: 'response_header', type: 'varchar', length: 255, nullable: true })
  responseHeader?: string;

  @Column({ name: 'responded_by', type: 'uuid', nullable: true })
  respondedBy?: string;

  @Column({ name: 'responded_by_name', type: 'varchar', length: 150, nullable: true })
  respondedByName?: string;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt?: Date;

  @Column({ name: 'push_notification_sent', type: 'boolean', default: true })
  pushNotificationSent: boolean;

  @Column({ name: 'is_drafting', type: 'boolean', default: false })
  isDrafting: boolean;

  @Column({ name: 'display_order', type: 'int', default: 999 })
  displayOrder: number;
}
