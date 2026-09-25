import { Entity, Column, OneToMany } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { ChildEntity } from './child.entity';

@Entity({ name: 'classes' })
export class ClassEntity extends BaseTenantTimestampedEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'grade_level', type: 'varchar', length: 50 })
  gradeLevel: string;

  @Column({ name: 'academic_year', type: 'varchar', length: 20 })
  academicYear: string;

  @Column({ name: 'room_number', type: 'varchar', length: 50, nullable: true })
  roomNumber?: string;

  @Column({ name: 'main_teacher_id', type: 'uuid', nullable: true })
  mainTeacherId?: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @OneToMany(() => ChildEntity, (child) => child.class)
  children: ChildEntity[];
}
