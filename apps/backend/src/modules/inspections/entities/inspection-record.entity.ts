import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('food_inspections')
export class InspectionRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'inspection_step', length: 50 })
  inspectionStep: string;

  @Column({ name: 'inspector_id', type: 'bigint', transformer: BigIntTransformer })
  inspectorId: number;

  @Column({ length: 20, default: 'PASS' })
  result: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;
}
