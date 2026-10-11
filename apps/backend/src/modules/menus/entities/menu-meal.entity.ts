import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { MenuDay } from './menu-day.entity';
import { MenuDish } from './menu-dish.entity';

@Entity('menu_meals')
export class MenuMeal {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_day_id', type: 'bigint', transformer: BigIntTransformer })
  menuDayId: number;

  @Column({ name: 'meal_type', length: 30 })
  mealType: string;

  @ManyToOne(() => MenuDay, (d) => d.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_day_id' })
  menuDay: MenuDay;

  @OneToMany(() => MenuDish, (d) => d.menuMeal)
  dishes: MenuDish[];
}
