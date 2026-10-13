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
import { InspectionImage } from './inspection-image.entity';

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

  @Column({ name: 'meal_session', length: 50, nullable: true, default: 'LUNCH' })
  mealSession: string;

  @Column({ name: 'session_code', length: 50, nullable: true })
  sessionCode: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @OneToMany(() => InspectionImage, (img) => img.inspection)
  images: InspectionImage[];
}
