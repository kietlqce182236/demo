import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
  Relation,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { NumericTransformer } from '../../foods/entities/food.entity';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('physical_measurements')
@Unique(['studentId', 'measuredDate'])
export class GrowthRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ name: 'measured_date', type: 'date' })
  measuredDate: string;

  @Column({ name: 'height_cm', type: 'numeric', precision: 5, scale: 1, transformer: NumericTransformer })
  heightCm: number;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 5, scale: 2, transformer: NumericTransformer })
  weightKg: number;

  @Column({ name: 'measured_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  measuredBy: number;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Child;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'measured_by' })
  measurer: User;

  @OneToOne(() => GrowthZscore, (z) => z.measurement)
  zscore: Relation<GrowthZscore>;
}

@Entity('growth_zscores')
export class GrowthZscore {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'measurement_id', type: 'bigint', transformer: BigIntTransformer })
  measurementId: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: NumericTransformer })
  waz: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: NumericTransformer })
  haz: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: NumericTransformer })
  baz: number;

  @Column({ length: 30, default: 'NORMAL' })
  classification: string;

  @OneToOne(() => GrowthRecord, (m) => m.zscore, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measurement_id' })
  measurement: Relation<GrowthRecord>;
}
