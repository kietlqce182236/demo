import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Dish } from './dish.entity';
import { Food } from '../../foods/entities/food.entity';

@Entity('recipe_items')
export class RecipeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ name: 'dish_id', type: 'uuid' })
  dishId: string;

  @Column({ name: 'food_id', type: 'uuid' })
  foodId: string;

  @Column({ name: 'net_weight_per_portion_g', type: 'numeric', precision: 10, scale: 2 })
  netWeightPerPortionG: number;

  @Column({ name: 'gross_weight_per_portion_g', type: 'numeric', precision: 10, scale: 2, nullable: true })
  grossWeightPerPortionG: number;

  @Column({ name: 'shrinkage_ratio', type: 'numeric', precision: 5, scale: 2, nullable: true })
  shrinkageRatio: number;

  @Column({ name: 'prep_notes', type: 'text', nullable: true })
  prepNotes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Dish, dish => dish.recipeItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @ManyToOne(() => Food, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'food_id' })
  food: Food;
}
