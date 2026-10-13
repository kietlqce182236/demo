import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { SnackRegistration } from '../../snack-services/entities/snack-registration.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'registration_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  registrationId: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: NumericTransformer,
  })
  amount: number;

  @Column({ name: 'vnpay_transaction_code', length: 100, nullable: true })
  vnpayTransactionCode: string;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @Column({ name: 'raw_response', type: 'text', nullable: true })
  rawResponse: string;

  @Column({ name: 'breakfast_subscription_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  breakfastSubscriptionId: number;

  @Column({ name: 'service_type', length: 30, default: 'SNACK' })
  serviceType: string;

  @ManyToOne(() => SnackRegistration, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registration_id' })
  registration: SnackRegistration;

  @ManyToOne('BreakfastSubscription', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'breakfast_subscription_id' })
  breakfastSubscription: any;
}
