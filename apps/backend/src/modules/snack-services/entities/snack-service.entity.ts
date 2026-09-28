import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('snack_services')
export class SnackServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'service_type', type: 'varchar', length: 50 })
  serviceType: string;

  @Column({ name: 'billing_cycle', type: 'varchar', length: 50 })
  billingCycle: string;

  @Column({ name: 'price_per_unit', type: 'decimal', precision: 12, scale: 2 })
  pricePerUnit: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'available_from', type: 'date' })
  availableFrom: string;

  @Column({ name: 'available_to', type: 'date', nullable: true })
  availableTo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
