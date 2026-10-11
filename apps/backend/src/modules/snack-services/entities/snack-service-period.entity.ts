import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { SnackRegistration } from './snack-registration.entity';

@Entity('snack_service_periods')
export class SnackServicePeriod {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'registration_deadline', type: 'date', nullable: true })
  registrationDeadline: string;

  @Column({
    name: 'fee_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: NumericTransformer,
  })
  feeAmount: number;

  @Column({ length: 20, default: 'OPEN' })
  status: string;

  @OneToMany(() => SnackRegistration, (reg) => reg.period)
  registrations: SnackRegistration[];
}
