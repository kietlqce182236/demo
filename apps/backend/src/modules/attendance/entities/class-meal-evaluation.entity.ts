import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../database/base.entity';
import { ClassEntity } from './class.entity';

@Entity({ name: 'class_meal_evaluations' })
export class ClassMealEvaluationEntity extends BaseTenantEntity {
  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'evaluation_date', type: 'date' })
  evaluationDate: string;

  @Column({ name: 'meal_type', type: 'varchar', length: 50 })
  mealType: string; // 'LUNCH' | 'AFTERNOON_SNACK' | etc.

  @Column({ name: 'softness_score', type: 'int', default: 5 })
  softnessScore: number;

  @Column({ name: 'temperature_score', type: 'int', default: 4 })
  temperatureScore: number;

  @Column({ name: 'excitement_score', type: 'int', default: 5 })
  excitementScore: number;

  @Column({ name: 'food_safety_checked', type: 'boolean', default: true })
  foodSafetyChecked: boolean;

  @Column({ name: 'chef_feedback', type: 'text', nullable: true })
  chefFeedback?: string;

  @Column({ name: 'head_chef_name', type: 'varchar', length: 100, default: 'Cô Phạm Lan' })
  headChefName: string;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt?: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'DRAFT' })
  status: string; // 'DRAFT' | 'SUBMITTED' | 'LOCKED'

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
