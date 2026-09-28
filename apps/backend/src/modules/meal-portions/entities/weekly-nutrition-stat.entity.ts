import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseTenantEntity } from '../../../database/base.entity';
import { DailyMealPortionEntity } from './daily-meal-portion.entity';

@Entity({ name: 'weekly_nutrition_stats' })
export class WeeklyNutritionStatEntity extends BaseTenantEntity {
  @Column({ name: 'portion_plan_id', type: 'uuid' })
  portionPlanId: string;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek: number;

  @Column({ name: 'total_calories', type: 'int' })
  totalCalories: number;

  @Column({ name: 'protein_ratio', type: 'numeric', precision: 5, scale: 2 })
  proteinRatio: number;

  @Column({ name: 'lipid_ratio', type: 'numeric', precision: 5, scale: 2 })
  lipidRatio: number;

  @Column({ name: 'glucid_ratio', type: 'numeric', precision: 5, scale: 2 })
  glucidRatio: number;

  @Column({ name: 'ratio_text', type: 'varchar', length: 50 })
  ratioText: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => DailyMealPortionEntity, (plan) => plan.nutritionStats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portion_plan_id' })
  portionPlan: DailyMealPortionEntity;
}
