import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Dish } from './dish.entity';

@Entity('dish_categories')
export class DishCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_required_in_meal', default: false })
  isRequiredInMeal: boolean;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @OneToMany(() => Dish, (d) => d.category)
  dishes: Dish[];
}
