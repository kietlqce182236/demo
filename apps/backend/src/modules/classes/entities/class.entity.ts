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

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'school_id', type: 'bigint', transformer: BigIntTransformer, default: 1 })
  schoolId: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'age_group', length: 20 })
  ageGroup: string;

  @Column({ name: 'school_year', length: 20 })
  schoolYear: string;

  @Column({ name: 'homeroom_teacher_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  homeroomTeacherId: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'homeroom_teacher_id' })
  homeroomTeacher: User;

  students: any[];
}
