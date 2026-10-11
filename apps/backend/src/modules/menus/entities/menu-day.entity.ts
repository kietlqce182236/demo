import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { MenuVersion } from './menu-version.entity';
import { MenuMeal } from './menu-meal.entity';

@Entity('menu_days')
export class MenuDay {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_version_id', type: 'bigint', transformer: BigIntTransformer })
  menuVersionId: number;

  @Column({ name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => MenuVersion, (v) => v.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_version_id' })
  menuVersion: MenuVersion;

  @OneToMany(() => MenuMeal, (m) => m.menuDay)
  meals: MenuMeal[];
}
