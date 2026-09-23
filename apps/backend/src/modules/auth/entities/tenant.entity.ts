import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * Tenant Entity — Mapping chính xác bảng `tenants` trong PostgreSQL.
 * Mỗi tenant đại diện cho 1 trường mầm non trong hệ thống Multi-tenant.
 * 
 * Performance Notes:
 * - Chỉ SELECT các cột cần thiết khi query (dùng QueryBuilder.select())
 * - Index trên `status` (WHERE deleted_at IS NULL) đã có sẵn trong schema.sql
 * - Index GIN trên `settings` JSONB cho full-text search cấu hình
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Mã trường duy nhất (e.g. 'MN_HOAMAI') — UNIQUE constraint */
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  /** Tên đầy đủ trường (e.g. 'Trường Mầm Non Hoa Mai') */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Subdomain riêng (e.g. 'hoamai.kidsnutri.vn') — UNIQUE, nullable */
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain: string | null;

  @Column({ type: 'varchar', length: 255, name: 'contact_email' })
  contactEmail: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'text' })
  address: string;

  /** ACTIVE | INACTIVE | SUSPENDED | TRIAL */
  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  /** FREE | STANDARD | PREMIUM | ENTERPRISE */
  @Column({ type: 'varchar', length: 50, name: 'subscription_tier', default: 'STANDARD' })
  subscriptionTier: string;

  @Column({ type: 'int', name: 'max_children', default: 500 })
  maxChildren: number;

  /** JSONB cấu hình: meal_times, food_retention_hours, who_zscore_auto_calc, etc. */
  @Column({ type: 'jsonb', default: () => `'{"meal_times":["BREAKFAST","LUNCH","AFTERNOON_SNACK"],"standard_weekly_cycle_length":4,"food_retention_hours":24,"who_zscore_auto_calc":true}'` })
  settings: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
