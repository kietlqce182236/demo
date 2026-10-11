import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';

@Entity('food_samples')
export class InspectionSampleItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'dish_name', length: 150 })
  dishName: string;

  @Column({ name: 'sample_code', length: 50 })
  sampleCode: string;

  @CreateDateColumn({ name: 'stored_at', type: 'timestamptz' })
  storedAt: Date;

  @Column({ name: 'dispose_at', type: 'timestamptz', nullable: true })
  disposeAt: Date;

  @Column({ length: 20, default: 'STORED' })
  status: string;

  @Column({ type: 'text', nullable: true })
  note: string;
}
