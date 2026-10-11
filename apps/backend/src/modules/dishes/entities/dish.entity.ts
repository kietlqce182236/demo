import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { DishCategory } from './dish-category.entity';
import { RecipeItem } from './recipe-item.entity';
import { DishNutrition } from './dish-nutrition.entity';
import { DishAllergen } from './dish-allergen.entity';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'category_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  categoryId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'standard_serving_size_g',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 100,
    transformer: NumericTransformer,
  })
  standardServingSizeG: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => DishCategory, (cat) => cat.dishes, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: DishCategory;

  @OneToMany(() => RecipeItem, (item) => item.dish)
  recipes: RecipeItem[];

  @OneToOne(() => DishNutrition, (nutr) => nutr.dish)
  nutrition: DishNutrition;

  @OneToMany(() => DishAllergen, (da) => da.dish)
  dishAllergens: DishAllergen[];
}
