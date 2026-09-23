import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Role Entity — Mapping chính xác bảng `roles` trong PostgreSQL.
 * Hệ thống có 7 system roles (tenant_id IS NULL) + tenant-scoped custom roles.
 *
 * Performance Notes:
 * - Index trên `tenant_id` đã có sẵn (idx_roles_tenant_id)
 * - UNIQUE constraint trên (tenant_id, code) ngăn role trùng lặp
 * - Khi JOIN user_roles chỉ cần SELECT id, code, name — tránh load description
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** NULL = system-wide role, UUID = tenant-scoped custom role */
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  /**
   * Role code dùng cho RBAC guard matching:
   * SUPER_ADMIN | PRINCIPAL | NUTRITIONIST | KITCHEN_MANAGER | TEACHER | PARENT | MEDICAL_STAFF
   */
  @Column({ type: 'varchar', length: 50 })
  code: string;

  /** Tên hiển thị tiếng Việt (e.g. 'Chuyên viên Dinh Dưỡng') */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** TRUE = role hệ thống không thể xóa/sửa bởi tenant admin */
  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
