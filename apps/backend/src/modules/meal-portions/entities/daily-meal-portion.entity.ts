import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

@Entity('daily_meal_portions')
export class DailyMealPortion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'class_id', type: 'bigint', transformer: BigIntTransformer })
  classId: number;

  @Column({ name: 'meal_type', length: 30 })
  mealType: string;

  @Column({ name: 'planned_quantity', default: 0 })
  plannedQuantity: number;

  @Column({ name: 'actual_quantity', nullable: true })
  actualQuantity: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
