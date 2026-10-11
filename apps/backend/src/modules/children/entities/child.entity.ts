import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { ChildAllergy } from './child-allergy.entity';

@Entity('students')
export class Child {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'class_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  classId: number;

  @Column({ name: 'student_code', length: 50 })
  studentCode: string;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ length: 10 })
  gender: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ClassEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @OneToMany(() => ChildAllergy, (allergy) => allergy.child)
  allergies: ChildAllergy[];
}
