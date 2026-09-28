import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('nutrition_rules')
export class NutritionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** NULL = Quy chuẩn hệ thống (Bộ GD&ĐT), UUID = Quy chuẩn tùy biến của trường */
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * TODDLER_18_36M | KINDERGARTEN_3_4Y | KINDERGARTEN_4_5Y | KINDERGARTEN_5_6Y | ALL_AGES
   */
  @Column({ type: 'varchar', length: 50, name: 'target_age_group' })
  targetAgeGroup: string;

  /**
   * FULL_DAY_SCHOOL | LUNCH_ONLY | SNACK_ONLY | PER_MEAL
   */
  @Column({ type: 'varchar', length: 50, name: 'meal_scope', default: 'FULL_DAY_SCHOOL' })
  mealScope: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'min_calories_kcal' })
  minCaloriesKcal: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'max_calories_kcal' })
  maxCaloriesKcal: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'min_protein_percent' })
  minProteinPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'max_protein_percent' })
  maxProteinPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'min_fat_percent' })
  minFatPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'max_fat_percent' })
  maxFatPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'min_carb_percent' })
  minCarbPercent: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'max_carb_percent' })
  maxCarbPercent: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'min_calcium_mg', default: 0 })
  minCalciumMg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'min_iron_mg', default: 0 })
  minIronMg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'min_zinc_mg', default: 0 })
  minZincMg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'max_sodium_mg', nullable: true })
  maxSodiumMg: number | null;

  @Column({ type: 'numeric', precision: 4, scale: 2, name: 'ca_p_ratio_min', default: 1.0 })
  caPRatioMin: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, name: 'ca_p_ratio_max', default: 1.5 })
  caPRatioMax: number;

  @Column({ type: 'boolean', name: 'is_strict', default: true })
  isStrict: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
