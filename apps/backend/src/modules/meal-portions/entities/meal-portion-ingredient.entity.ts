import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { DailyMealPortionEntity } from './daily-meal-portion.entity';

@Entity({ name: 'meal_portion_ingredients' })
export class MealPortionIngredientEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'portion_plan_id', type: 'uuid' })
  portionPlanId: string;

  @Column({ name: 'sort_order', type: 'int', default: 1 })
  sortOrder: number;

  @Column({ name: 'ingredient_name', type: 'varchar', length: 255 })
  ingredientName: string;

  @Column({ name: 'quota_description', type: 'varchar', length: 255 })
  quotaDescription: string;

  @Column({ name: 'quota_per_child', type: 'numeric', precision: 8, scale: 2 })
  quotaPerChild: number;

  @Column({ name: 'loss_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  lossRatePercent: number;

  @Column({ name: 'target_children_count', type: 'int', default: 328 })
  targetChildrenCount: number;

  @Column({ name: 'target_badge', type: 'varchar', length: 100, nullable: true })
  targetBadge?: string;

  @Column({ name: 'calculated_quantity', type: 'numeric', precision: 8, scale: 2 })
  calculatedQuantity: number;

  @Column({ type: 'varchar', length: 20, default: 'kg' })
  unit: string;

  @Column({ name: 'warehouse_stock_text', type: 'varchar', length: 150 })
  warehouseStockText: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 50, default: 'READY' })
  status: string;

  @ManyToOne(() => DailyMealPortionEntity, (plan) => plan.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portion_plan_id' })
  portionPlan: DailyMealPortionEntity;
}
