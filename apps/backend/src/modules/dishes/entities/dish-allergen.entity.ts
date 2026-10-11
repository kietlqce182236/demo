import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Dish } from './dish.entity';
import { AllergenCatalog } from '../../children/entities/allergen-catalog.entity';

@Entity('dish_allergens')
export class DishAllergen {
  @PrimaryColumn({ name: 'dish_id', type: 'bigint' })
  dishId: number;

  @PrimaryColumn({ name: 'allergen_id', type: 'bigint' })
  allergenId: number;

  @Column({ name: 'risk_level', length: 20, default: 'HIGH' })
  riskLevel: string;

  @Column({ length: 255, nullable: true })
  note: string;

  @ManyToOne(() => Dish, (d) => d.dishAllergens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @ManyToOne(() => AllergenCatalog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergen_id' })
  allergen: AllergenCatalog;
}
