import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InspectionRecord } from './inspection-record.entity';

@Entity('inspection_sample_items')
export class InspectionSampleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_record_id', type: 'uuid' })
  inspectionRecordId: string;

  @ManyToOne(() => InspectionRecord, record => record.sampleItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspection_record_id' })
  inspectionRecord: InspectionRecord;

  @Column({ name: 'dish_id', type: 'uuid', nullable: true })
  dishId: string;

  @Column({ name: 'dish_name', type: 'varchar', length: 255 })
  dishName: string;

  @Column({ name: 'quantity_grams', type: 'numeric', precision: 6, scale: 1 })
  quantityGrams: number;
}
