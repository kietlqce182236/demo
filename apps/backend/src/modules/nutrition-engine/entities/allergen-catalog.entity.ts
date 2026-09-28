import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('allergen_catalogs')
export class AllergenCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** NULL = Allergen danh mục chuẩn toàn quốc, UUID = Tùy chỉnh riêng của trường */
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  /**
   * COW_MILK | PEANUT | CRUSTACEAN | FISH | EGG | SOYBEAN | WHEAT_GLUTEN | TREE_NUT | CUSTOM
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150, name: 'name_vi' })
  nameVi: string;

  @Column({ type: 'varchar', length: 150, name: 'name_en', nullable: true })
  nameEn: string | null;

  @Column({ type: 'text', name: 'common_foods', nullable: true })
  commonFoods: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
