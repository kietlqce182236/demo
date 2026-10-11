import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { AllergenCatalog } from './allergen-catalog.entity';
import { Child } from './child.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('student_allergies')
export class ChildAllergy {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ name: 'allergen_id', type: 'bigint', transformer: BigIntTransformer })
  allergenId: number;

  @Column({ length: 20, default: 'MEDIUM' })
  severity: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'declared_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  declaredBy: number;

  @CreateDateColumn({ name: 'declared_at', type: 'timestamptz' })
  declaredAt: Date;

  @ManyToOne(() => Child, (child) => child.allergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  child: Child;

  @ManyToOne(() => AllergenCatalog, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergen_id' })
  allergen: AllergenCatalog;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'declared_by' })
  declarer: User;
}
