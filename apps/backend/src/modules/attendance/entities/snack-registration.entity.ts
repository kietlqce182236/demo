import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { ChildEntity } from './child.entity';

@Entity({ name: 'snack_registrations' })
export class SnackRegistrationEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'snack_service_id', type: 'uuid' })
  snackServiceId: string;

  @Column({ name: 'registered_by', type: 'uuid' })
  registeredBy: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'quantity_per_day', type: 'int', default: 1 })
  quantityPerDay: number;

  @Column({ name: 'total_price', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'PAID' })
  paymentStatus: string;

  @Column({ name: 'snack_diet_type', type: 'varchar', length: 50, default: 'STANDARD' })
  snackDietType: string;

  @Column({ name: 'snack_diet_badge_text', type: 'varchar', length: 100, default: 'Tiêu chuẩn' })
  snackDietBadgeText: string;

  @Column({ name: 'snack_diet_badge_type', type: 'varchar', length: 50, default: 'blue' })
  snackDietBadgeType: string;

  @Column({ name: 'kitchen_notes', type: 'text', nullable: true })
  kitchenNotes?: string;

  @Column({ name: 'special_notes', type: 'text', nullable: true })
  specialNotes?: string;

  @Column({ name: 'display_order', type: 'int', default: 999 })
  displayOrder: number;

  @ManyToOne(() => ChildEntity)
  @JoinColumn({ name: 'child_id' })
  child: ChildEntity;
}
