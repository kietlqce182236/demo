import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseTenantSoftDeleteEntity } from '../../../database/base.entity';
import { ClassEntity } from './class.entity';
import { ChildAllergyEntity } from './child-allergy.entity';
import { DailyMealAttendanceEntity } from './daily-meal-attendance.entity';

@Entity({ name: 'children' })
export class ChildEntity extends BaseTenantSoftDeleteEntity {
  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId?: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ name: 'student_code', type: 'varchar', length: 50 })
  studentCode: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'varchar', length: 10 })
  gender: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType?: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 255, default: '' })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 50, default: '' })
  emergencyContactPhone: string;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes?: string;

  @ManyToOne(() => ClassEntity, (cls) => cls.children)
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @OneToMany(() => ChildAllergyEntity, (allergy) => allergy.child)
  allergies: ChildAllergyEntity[];

  @OneToMany(() => DailyMealAttendanceEntity, (att) => att.child)
  mealAttendances: DailyMealAttendanceEntity[];
}
