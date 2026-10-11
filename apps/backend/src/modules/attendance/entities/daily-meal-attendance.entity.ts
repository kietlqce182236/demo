import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('meal_attendances')
@Unique(['studentId', 'date', 'mealType'])
export class DailyMealAttendance {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'meal_type', length: 30 })
  mealType: string;

  @Column({ name: 'is_attended', default: true })
  isAttended: boolean;

  @Column({ name: 'consumption_level', length: 20, nullable: true })
  consumptionLevel: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'recorded_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  recordedBy: number;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Child;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by' })
  recorder: User;
}
