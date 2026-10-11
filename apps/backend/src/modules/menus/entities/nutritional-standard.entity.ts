import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { NumericTransformer } from '../../foods/entities/food.entity';

@Entity('nutritional_standards')
export class NutritionalStandard {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'age_group', length: 20 })
  ageGroup: string;

  @Column({ name: 'meal_scope', length: 20 })
  mealScope: string;

  @Column({ name: 'min_energy_kcal', type: 'numeric', precision: 6, scale: 1, transformer: NumericTransformer })
  minEnergyKcal: number;

  @Column({ name: 'max_energy_kcal', type: 'numeric', precision: 6, scale: 1, transformer: NumericTransformer })
  maxEnergyKcal: number;

  @Column({ name: 'min_protein_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  minProteinPct: number;

  @Column({ name: 'max_protein_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  maxProteinPct: number;

  @Column({ name: 'min_fat_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  minFatPct: number;

  @Column({ name: 'max_fat_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  maxFatPct: number;

  @Column({ name: 'min_carb_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  minCarbPct: number;

  @Column({ name: 'max_carb_pct', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  maxCarbPct: number;

  @Column({ name: 'min_calcium_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  minCalciumMg: number;

  @Column({ name: 'min_iron_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  minIronMg: number;

  @Column({ name: 'min_zinc_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  minZincMg: number;

  @Column({ name: 'max_sodium_mg', type: 'numeric', precision: 8, scale: 2, default: 0, transformer: NumericTransformer })
  maxSodiumMg: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
