import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTenantTimestampedEntity } from '../../../database/base.entity';
import { ChildEntity } from './child.entity';

@Entity({ name: 'child_allergies' })
export class ChildAllergyEntity extends BaseTenantTimestampedEntity {
  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'allergen_id', type: 'uuid', nullable: true })
  allergenId?: string;

  @Column({ name: 'custom_allergen_name', type: 'varchar', length: 150, nullable: true })
  customAllergenName?: string;

  @Column({ name: 'allergy_type', type: 'varchar', length: 50, default: 'ALLERGY' })
  allergyType: string;

  @Column({ type: 'varchar', length: 50, default: 'MODERATE' })
  severity: string;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ name: 'reaction_treatment', type: 'text', nullable: true })
  reactionTreatment?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => ChildEntity, (child) => child.allergies)
  @JoinColumn({ name: 'child_id' })
  child: ChildEntity;
}
