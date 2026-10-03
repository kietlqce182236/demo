import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Dish } from './dish.entity';

@Entity('dish_approval_requests')
export class DishApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'dish_id', type: 'uuid' })
  dishId: string;

  @ManyToOne(() => Dish, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy: string;

  @Column({ name: 'request_reason', type: 'text', nullable: true })
  requestReason: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // 'PENDING' | 'APPROVED' | 'REJECTED'

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
