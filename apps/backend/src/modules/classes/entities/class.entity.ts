import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'grade_level' })
  gradeLevel: string;

  @Column({ name: 'academic_year' })
  academicYear: string;

  @Column({ name: 'room_number', nullable: true })
  roomNumber: string;

  @Column({ name: 'main_teacher_id', type: 'uuid', nullable: true })
  mainTeacherId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'main_teacher_id' })
  mainTeacher: UserEntity;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
