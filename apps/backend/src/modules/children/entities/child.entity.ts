import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ClassEntity } from '../../classes/entities/class.entity';
import { ChildAllergy } from './child-allergy.entity';

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string;

  @Column({ name: 'student_code', length: 50 })
  studentCode: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ length: 10 })
  gender: string; // 'MALE' | 'FEMALE' | 'OTHER'

  @Column({ name: 'blood_type', length: 10, nullable: true })
  bloodType: string;

  @Column({ name: 'enrollment_date', type: 'date', default: () => 'CURRENT_DATE' })
  enrollmentDate: string;

  @Column({ length: 50, default: 'ACTIVE' })
  status: string; // 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'WITHDRAWN'

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ name: 'emergency_contact_name', length: 255 })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', length: 50 })
  emergencyContactPhone: string;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes: string;

  @OneToMany(() => ChildAllergy, (allergy) => allergy.child)
  allergies: ChildAllergy[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date;
}
