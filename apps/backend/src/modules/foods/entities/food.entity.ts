import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { FoodCategory } from './food-category.entity';

export const NumericTransformer = {
  to: (value?: number | null): number | null => (value !== undefined && value !== null ? Number(value) : null),
  from: (value?: string | number | null): number => (value !== undefined && value !== null ? parseFloat(String(value)) : 0),
};

@Entity('food_ingredients')
export class Food {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'category_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  categoryId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 20, default: 'g' })
  unit: string;

  @Column({ name: 'energy_kcal_100g', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  energyKcal100g: number;

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

  @Column({ name: 'phosphorus_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  phosphorusMg: number;

  @Column({ name: 'sodium_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  sodiumMg: number;

  @Column({ name: 'vitamin_a_mcg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  vitaminAMcg: number;

  @Column({ name: 'vitamin_c_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  vitaminCMg: number;

  @Column({ name: 'refuse_rate_percent', type: 'numeric', precision: 5, scale: 2, default: 0, transformer: NumericTransformer })
  refuseRatePercent: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => FoodCategory, (cat) => cat.foods, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: FoodCategory;
}
