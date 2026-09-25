import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Dish } from './dish.entity';

@Entity('menu_dishes')
export class MenuDish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'menu_id', type: 'uuid' })
  menuId: string;

  @Column({ name: 'dish_id', type: 'uuid' })
  dishId: string;

  /**
   * 1 = Thứ Hai, 2 = Thứ Ba, 3 = Thứ Tư, 4 = Thứ Năm, 5 = Thứ Sáu
   */
  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek: number;

  /**
   * BREAKFAST | MORNING_SNACK | LUNCH | AFTERNOON_SNACK | LATE_SNACK
   */
  @Column({ name: 'meal_time', type: 'varchar', length: 50 })
  mealTime: string;

  @Column({ name: 'serving_order', type: 'int', default: 1 })
  servingOrder: number;

  @Column({ name: 'portion_size_g', type: 'numeric', precision: 8, scale: 2, default: 100 })
  portionSizeG: number;

  @Column({ name: 'planned_calories', type: 'numeric', precision: 8, scale: 2, default: 0 })
  plannedCalories: number;

  @Column({ name: 'substitute_dish_id', type: 'uuid', nullable: true })
  substituteDishId: string | null;

  @Column({ name: 'special_diet_notes', type: 'text', nullable: true })
  specialDietNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Menu, (menu) => menu.menuDishes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => Dish, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @ManyToOne(() => Dish, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'substitute_dish_id' })
  substituteDish: Dish | null;
}
