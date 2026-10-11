import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { Dish } from './dish.entity';

@Entity('dish_nutrition')
export class DishNutrition {
  @PrimaryColumn({ name: 'dish_id', type: 'bigint', transformer: BigIntTransformer })
  dishId: number;

  @Column({ name: 'energy_kcal', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  energyKcal: number;

  @Column({ name: 'protein_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  proteinG: number;

  @Column({ name: 'fat_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  fatG: number;

  @Column({ name: 'carb_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  carbG: number;

  @Column({ name: 'fiber_g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  fiberG: number;

  @Column({ name: 'calcium_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  calciumMg: number;

  @Column({ name: 'iron_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  ironMg: number;

  @Column({ name: 'zinc_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  zincMg: number;

  @OneToOne(() => Dish, (dish) => dish.nutrition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}
