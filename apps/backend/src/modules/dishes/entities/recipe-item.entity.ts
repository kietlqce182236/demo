import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { Dish } from './dish.entity';
import { Food } from '../../foods/entities/food.entity';

@Entity('dish_recipes')
@Unique(['dishId', 'ingredientId'])
export class RecipeItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'dish_id', type: 'bigint', transformer: BigIntTransformer })
  dishId: number;

  @Column({ name: 'ingredient_id', type: 'bigint', transformer: BigIntTransformer })
  ingredientId: number;

  @Column({ name: 'gross_weight_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  grossWeightG: number;

  @Column({ name: 'net_weight_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  netWeightG: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => Dish, (d) => d.recipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @ManyToOne(() => Food, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Food;
}
