import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { MenuCycle } from './menu-cycle.entity';
import { MenuVersion } from './menu-version.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'cycle_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  cycleId: number;

  @Column({ name: 'week_start_date', type: 'date' })
  weekStartDate: string;

  @Column({ name: 'week_end_date', type: 'date' })
  weekEndDate: string;

  @Column({ name: 'age_group', length: 20 })
  ageGroup: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 20, default: 'DRAFT' })
  status: string;

  @Column({ name: 'created_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  createdBy: number;

  @Column({ name: 'approved_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  approvedBy: number;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @ManyToOne(() => MenuCycle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cycle_id' })
  cycle: MenuCycle;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @OneToMany(() => MenuVersion, (v) => v.menu)
  versions: MenuVersion[];
}
