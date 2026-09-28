import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ name: 'energy_kcal', type: 'numeric', precision: 8, scale: 2, default: 0 })
  energyKcal: number;

  @Column({ name: 'protein_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  proteinG: number;

  @Column({ name: 'fat_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  fatG: number;

  @Column({ name: 'carb_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  carbG: number;

  @Column({ name: 'fiber_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  fiberG: number;

  @Column({ name: 'calcium_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  calciumMg: number;

  @Column({ name: 'iron_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  ironMg: number;

  @Column({ name: 'zinc_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  zincMg: number;

  @Column({ name: 'vitamin_a_mcg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  vitaminAMcg: number;

  @Column({ name: 'vitamin_c_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  vitaminCMg: number;

  @Column({ name: 'refuse_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  refuseRatePercent: number;

  @Column({ name: 'default_unit', type: 'varchar', length: 50, default: 'gram' })
  defaultUnit: string;

  @Column({ type: 'text', array: true, nullable: true })
  allergens: string[];

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
