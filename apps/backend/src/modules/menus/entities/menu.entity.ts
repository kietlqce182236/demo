import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuDish } from './menu-dish.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * WEEKLY | BIWEEKLY | MONTHLY | CUSTOM
   */
  @Column({ name: 'menu_cycle_type', type: 'varchar', length: 50, default: 'WEEKLY' })
  menuCycleType: string;

  /**
   * TODDLER_18_36M | KINDERGARTEN_3_4Y | KINDERGARTEN_4_5Y | KINDERGARTEN_5_6Y | ALL_AGES
   */
  @Column({ name: 'target_age_group', type: 'varchar', length: 50, default: 'ALL_AGES' })
  targetAgeGroup: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'cycle_week_number', type: 'int', default: 1 })
  cycleWeekNumber: number;

  /**
   * DRAFT | SUBMITTED_FOR_REVIEW | APPROVED | REJECTED | ACTIVE | ARCHIVED
   */
  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approval_notes', type: 'text', nullable: true })
  approvalNotes: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  /** Quản lý phiên bản: 1, 2, 3... tương ứng v1.0, v1.1, v2.0 */
  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'parent_menu_id', type: 'uuid', nullable: true })
  parentMenuId: string | null;

  @Column({ name: 'daily_average_calories', type: 'numeric', precision: 8, scale: 2, default: 0 })
  dailyAverageCalories: number;

  @Column({ name: 'daily_average_protein_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  dailyAverageProteinG: number;

  @Column({ name: 'daily_average_fat_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  dailyAverageFatG: number;

  @Column({ name: 'daily_average_carb_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  dailyAverageCarbG: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => MenuDish, (menuDish) => menuDish.menu, { cascade: true })
  menuDishes: MenuDish[];

  @ManyToOne(() => Menu, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_menu_id' })
  parentMenu: Menu | null;
}
