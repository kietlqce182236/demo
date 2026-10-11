import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('staff_profiles')
export class StaffProfile {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', transformer: BigIntTransformer })
  userId: number;

  @Column({ name: 'staff_type', length: 50, nullable: true })
  staffType: string;

  @Column({ length: 100, nullable: true })
  position: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
