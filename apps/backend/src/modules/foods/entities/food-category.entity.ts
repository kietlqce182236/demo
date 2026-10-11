import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Food } from './food.entity';

@Entity('food_categories')
export class FoodCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Food, (food) => food.category)
  foods: Food[];
}
