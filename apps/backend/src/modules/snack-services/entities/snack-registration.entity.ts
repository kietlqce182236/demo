import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { SnackServicePeriod } from './snack-service-period.entity';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('snack_registrations')
export class SnackRegistration {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'period_id', type: 'bigint', transformer: BigIntTransformer })
  periodId: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ name: 'parent_id', type: 'bigint', transformer: BigIntTransformer })
  parentId: number;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz' })
  registeredAt: Date;

  @ManyToOne(() => SnackServicePeriod, (p) => p.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'period_id' })
  period: SnackServicePeriod;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Child;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;
}
