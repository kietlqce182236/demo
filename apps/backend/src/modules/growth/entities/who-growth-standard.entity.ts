import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('who_growth_standards')
@Unique(['indicator', 'gender', 'ageInMonths'])
export class WhoGrowthStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  indicator: string; // 'WAZ', 'HAZ', 'BAZ', 'WHZ'

  @Column({ type: 'varchar', length: 10 })
  gender: string; // 'MALE', 'FEMALE'

  @Column({ type: 'int', name: 'age_in_months' })
  ageInMonths: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, name: 'l_value' })
  lValue: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, name: 'm_value' })
  mValue: number;

  @Column({ type: 'numeric', precision: 8, scale: 4, name: 's_value' })
  sValue: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd3_neg' })
  sd3Neg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd2_neg' })
  sd2Neg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd1_neg' })
  sd1Neg: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd0' })
  sd0: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd1_pos' })
  sd1Pos: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd2_pos' })
  sd2Pos: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'sd3_pos' })
  sd3Pos: number;
}
