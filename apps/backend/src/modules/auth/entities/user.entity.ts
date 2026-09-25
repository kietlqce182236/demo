import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './role.entity';

/**
 * User Entity — Mapping chính xác bảng `users` trong PostgreSQL.
 *
 * Performance Notes:
 * - password_hash và two_factor_secret KHÔNG BAO GIỜ trả về client (dùng select: false)
 * - Index composite (tenant_id, status) WHERE deleted_at IS NULL cho query nhanh
 * - Index trên email cho login lookup O(log n)
 * - ManyToMany roles: LAZY — chỉ JOIN khi cần (login flow), không eager load
 * - two_factor_recovery_codes dùng text[] PostgreSQL array, cũng select: false
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** NULL = superadmin toàn hệ thống, UUID = user thuộc tenant cụ thể */
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  /** Email đăng nhập — UNIQUE per tenant (composite constraint uq_users_tenant_email) */
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /**
   * Bcrypt hash ($2a$12$...) — KHÔNG trả về client.
   * select: false đảm bảo TypeORM không load cột này trừ khi addSelect() rõ ràng.
   */
  @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  /** ACTIVE | INACTIVE | BLOCKED | INVITED */
  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'boolean', name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  /** TOTP secret — KHÔNG trả về client */
  @Column({ type: 'varchar', length: 255, name: 'two_factor_secret', nullable: true, select: false })
  twoFactorSecret: string | null;

  /** Recovery codes — KHÔNG trả về client */
  @Column({ type: 'text', array: true, name: 'two_factor_recovery_codes', nullable: true, select: false })
  twoFactorRecoveryCodes: string[] | null;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  /**
   * Quan hệ ManyToMany với Role qua bảng trung gian `user_roles`.
   * 
   * KHÔNG dùng eager: true — chỉ load khi controller cần (leftJoinAndSelect).
   * JoinTable mapping chính xác tên bảng và cột FK trong schema.sql.
   */
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
