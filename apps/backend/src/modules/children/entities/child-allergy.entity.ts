import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Child } from './child.entity';
import { AllergenCatalog } from './allergen-catalog.entity';

@Entity('child_allergies')
export class ChildAllergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @ManyToOne(() => Child, (child) => child.allergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @Column({ name: 'allergen_id', type: 'uuid', nullable: true })
  allergenId: string;

  @ManyToOne(() => AllergenCatalog, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'allergen_id' })
  allergen: AllergenCatalog;

  @Column({ name: 'custom_allergen_name', length: 150, nullable: true })
  customAllergenName: string;

  @Column({ name: 'allergy_type', length: 50, default: 'ALLERGY' })
  allergyType: string; // 'ALLERGY' | 'INTOLERANCE' | 'RELIGIOUS_RESTRICTION' | 'MEDICAL_RESTRICTION'

  @Column({ length: 50, default: 'MODERATE' })
  severity: string; // 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC'

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ name: 'reaction_treatment', type: 'text', nullable: true })
  reactionTreatment: string;

  @Column({ name: 'diagnosed_date', type: 'date', nullable: true })
  diagnosedDate: string;

  @Column({ name: 'medical_certificate_url', type: 'text', nullable: true })
  medicalCertificateUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
