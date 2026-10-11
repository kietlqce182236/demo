import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { MenuMeal } from './menu-meal.entity';
import { Dish } from '../../dishes/entities/dish.entity';

@Entity('menu_dishes')
export class MenuDish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_meal_id', type: 'bigint', transformer: BigIntTransformer })
  menuMealId: number;

  @Column({ name: 'dish_id', type: 'bigint', transformer: BigIntTransformer })
  dishId: number;

  @Column({
    name: 'portion_size_g',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: NumericTransformer,
  })
  portionSizeG: number;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'special_diet_notes', type: 'text', nullable: true })
  specialDietNotes: string | null;

  @ManyToOne(() => MenuMeal, (m) => m.dishes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_meal_id' })
  menuMeal: MenuMeal;

  @ManyToOne(() => Dish, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}
