import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { DailyMealPortionEntity } from './daily-meal-portion.entity';

@Entity({ name: 'weekly_menu_plan_items' })
export class WeeklyMenuPlanItemEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'portion_plan_id', type: 'uuid' })
  portionPlanId: string;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek: number;

  @Column({ name: 'day_name', type: 'varchar', length: 50 })
  dayName: string;

  @Column({ name: 'day_code', type: 'varchar', length: 10 })
  dayCode: string;

  @Column({ name: 'plan_date', type: 'date' })
  planDate: string;

  @Column({ name: 'meal_session', type: 'varchar', length: 50 })
  mealSession: string;

  @Column({ name: 'meal_time_text', type: 'varchar', length: 20 })
  mealTimeText: string;

  @Column({ name: 'session_calories', type: 'int' })
  sessionCalories: number;

  @Column({ name: 'dish_name', type: 'varchar', length: 255 })
  dishName: string;

  @Column({ name: 'dish_description', type: 'varchar', length: 255, nullable: true })
  dishDescription?: string;

  @Column({ name: 'badge_text', type: 'varchar', length: 100, nullable: true })
  badgeText?: string;

  @Column({ name: 'has_allergy_warning', type: 'boolean', default: false })
  hasAllergyWarning: boolean;

  @Column({ name: 'allergy_substitute_text', type: 'text', nullable: true })
  allergySubstituteText?: string;

  @Column({ name: 'item_order', type: 'int', default: 1 })
  itemOrder: number;

  @ManyToOne(() => DailyMealPortionEntity, (plan) => plan.menuItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portion_plan_id' })
  portionPlan: DailyMealPortionEntity;
}
