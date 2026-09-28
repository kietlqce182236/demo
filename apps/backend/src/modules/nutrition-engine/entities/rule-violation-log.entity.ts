import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('rule_violations_log')
export class RuleViolationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'rule_id', nullable: true })
  ruleId: string | null;

  @Column({ type: 'uuid', name: 'menu_id', nullable: true })
  menuId: string | null;

  @Column({ type: 'uuid', name: 'dish_id', nullable: true })
  dishId: string | null;

  @Column({ type: 'uuid', name: 'child_id', nullable: true })
  childId: string | null;

  /**
   * CALORIE_DEFICIT | CALORIE_EXCESS | PROTEIN_OUT_OF_RANGE | FAT_OUT_OF_RANGE
   * CARB_OUT_OF_RANGE | CALCIUM_DEFICIT | IRON_DEFICIT | ALLERGEN_CONFLICT
   * INCOMPATIBLE_FOODS | REPEAT_DISH_IN_CYCLE
   */
  @Column({ type: 'varchar', length: 50, name: 'violation_code' })
  violationCode: string;

  /**
   * INFO | WARNING | CRITICAL | FATAL_BLOCKER
   */
  @Column({ type: 'varchar', length: 50 })
  severity: string;

  @Column({ type: 'date', name: 'target_date', nullable: true })
  targetDate: string | null;

  @Column({ type: 'varchar', length: 50, name: 'meal_type', nullable: true })
  mealType: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  /**
   * OPEN | ACKNOWLEDGED | RESOLVED | OVERRIDDEN
   */
  @Column({ type: 'varchar', length: 50, default: 'OPEN' })
  status: string;

  @Column({ type: 'uuid', name: 'resolved_by', nullable: true })
  resolvedBy: string | null;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'text', name: 'resolution_comment', nullable: true })
  resolutionComment: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
