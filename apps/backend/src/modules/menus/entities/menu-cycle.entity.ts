import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';

@Entity('menu_cycles')
export class MenuCycle {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'age_group', length: 20 })
  ageGroup: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'cycle_length_weeks', default: 4 })
  cycleLengthWeeks: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
