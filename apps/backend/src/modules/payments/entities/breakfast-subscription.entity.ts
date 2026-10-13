import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('breakfast_subscriptions')
export class BreakfastSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ name: 'parent_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  parentId: number;

  @Column({ name: 'package_id', length: 50 })
  packageId: string;

  @Column({ name: 'package_name', length: 150 })
  packageName: string;

  @Column({ name: 'meal_count', type: 'int', default: 22 })
  mealCount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: NumericTransformer,
  })
  amount: number;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'vnpay_order_id', length: 100, nullable: true })
  vnpayOrderId: string;

  @Column({ name: 'vnpay_transaction_no', length: 100, nullable: true })
  vnpayTransactionNo: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Child;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;
}
