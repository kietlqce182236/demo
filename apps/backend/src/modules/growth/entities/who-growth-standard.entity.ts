import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';

@Entity('who_growth_standards')
export class WhoGrowthStandard {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 10 })
  indicator: string;

  @Column({ length: 10 })
  gender: string;

  @Column({ name: 'age_in_months' })
  ageInMonths: number;

  @Column({ name: 'l_value', type: 'numeric', precision: 8, scale: 4, transformer: NumericTransformer })
  lValue: number;

  @Column({ name: 'm_value', type: 'numeric', precision: 8, scale: 4, transformer: NumericTransformer })
  mValue: number;

  @Column({ name: 's_value', type: 'numeric', precision: 8, scale: 4, transformer: NumericTransformer })
  sValue: number;

  @Column({ name: 'sd3_neg', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd3Neg: number;

  @Column({ name: 'sd2_neg', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd2Neg: number;

  @Column({ name: 'sd1_neg', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd1Neg: number;

  @Column({ name: 'sd0', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd0: number;

  @Column({ name: 'sd1_pos', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd1Pos: number;

  @Column({ name: 'sd2_pos', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd2Pos: number;

  @Column({ name: 'sd3_pos', type: 'numeric', precision: 8, scale: 2, transformer: NumericTransformer })
  sd3Pos: number;
}
