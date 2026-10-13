import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { InspectionRecord } from './inspection-record.entity';

@Entity('inspection_images')
export class InspectionImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'inspection_id', type: 'bigint', transformer: BigIntTransformer })
  inspectionId: number;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @ManyToOne(() => InspectionRecord, (inspection) => inspection.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inspection_id' })
  inspection: InspectionRecord;
}
