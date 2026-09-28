import { Entity, Column, OneToMany } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { MealPortionIngredientEntity } from './meal-portion-ingredient.entity';
import { WeeklyMenuPlanItemEntity } from './weekly-menu-plan-item.entity';
import { WeeklyNutritionStatEntity } from './weekly-nutrition-stat.entity';

@Entity({ name: 'daily_meal_portions' })
export class DailyMealPortionEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'week_number', type: 'int' })
  weekNumber: number;

  @Column({ name: 'school_year', type: 'varchar', length: 100 })
  schoolYear: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 50, default: 'APPROVED' })
  status: string;

  @Column({ name: 'approval_status', type: 'varchar', length: 50, default: 'ĐÃ PHÊ DUYỆT' })
  approvalStatus: string;

  @Column({ name: 'approved_by_name', type: 'varchar', length: 150, default: 'HT. Nguyễn Thu Thủy' })
  approvedByName: string;

  @Column({ name: 'approved_at_text', type: 'varchar', length: 150, default: 'Công bố: 17/11 • HT. Nguyễn Thu Thủy 16:30' })
  approvedAtText: string;

  @Column({ name: 'total_boarding_students', type: 'int', default: 328 })
  totalBoardingStudents: number;

  @Column({ name: 'total_enrolled_students', type: 'int', default: 342 })
  totalEnrolledStudents: number;

  @Column({ name: 'attendance_rate', type: 'numeric', precision: 5, scale: 2, default: 95.9 })
  attendanceRate: number;

  @Column({ name: 'allergic_children_count', type: 'int', default: 14 })
  allergicChildrenCount: number;

  @Column({ name: 'safe_substitute_rate', type: 'numeric', precision: 5, scale: 2, default: 100.0 })
  safeSubstituteRate: number;

  @Column({ name: 'avg_calories', type: 'numeric', precision: 6, scale: 1, default: 715.0 })
  avgCalories: number;

  @Column({ name: 'energy_coverage_rate', type: 'numeric', precision: 5, scale: 2, default: 52.0 })
  energyCoverageRate: number;

  @Column({ name: 'standard_quote', type: 'text' })
  standardQuote: string;

  @Column({ name: 'banner_quote', type: 'text' })
  bannerQuote: string;

  @Column({ name: 'protein_percent', type: 'numeric', precision: 5, scale: 2, default: 14.0 })
  proteinPercent: number;

  @Column({ name: 'lipid_percent', type: 'numeric', precision: 5, scale: 2, default: 26.0 })
  lipidPercent: number;

  @Column({ name: 'glucid_percent', type: 'numeric', precision: 5, scale: 2, default: 60.0 })
  glucidPercent: number;

  @Column({ name: 'is_locked', type: 'boolean', default: true })
  isLocked: boolean;

  @Column({ name: 'is_published_to_parents', type: 'boolean', default: true })
  isPublishedToParents: boolean;

  @Column({ name: 'is_warehouse_exported', type: 'boolean', default: false })
  isWarehouseExported: boolean;

  @Column({ name: 'exported_at', type: 'timestamptz', nullable: true })
  exportedAt?: Date;

  @OneToMany(() => MealPortionIngredientEntity, (ing) => ing.portionPlan)
  ingredients: MealPortionIngredientEntity[];

  @OneToMany(() => WeeklyMenuPlanItemEntity, (item) => item.portionPlan)
  menuItems: WeeklyMenuPlanItemEntity[];

  @OneToMany(() => WeeklyNutritionStatEntity, (stat) => stat.portionPlan)
  nutritionStats: WeeklyNutritionStatEntity[];
}
