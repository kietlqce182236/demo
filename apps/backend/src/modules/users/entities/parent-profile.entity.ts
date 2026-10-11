import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('parent_profiles')
export class ParentProfile {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', transformer: BigIntTransformer })
  userId: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  occupation: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
