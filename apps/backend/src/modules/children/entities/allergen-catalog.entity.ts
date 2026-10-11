import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';

@Entity('allergens')
export class AllergenCatalog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 30, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
