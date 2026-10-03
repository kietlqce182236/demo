import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Child } from './child.entity';
import { ChildAllergy } from './child-allergy.entity';

@Entity('child_allergy_history')
export class ChildAllergyHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'child_allergy_id', type: 'uuid', nullable: true })
  childAllergyId: string;

  @ManyToOne(() => ChildAllergy, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'child_allergy_id' })
  childAllergy: ChildAllergy;

  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @Column({ name: 'change_type', length: 20 })
  changeType: string; // 'CREATED' | 'UPDATED' | 'DEACTIVATED'

  @Column({ name: 'old_data', type: 'jsonb', nullable: true })
  oldData: any;

  @Column({ name: 'new_data', type: 'jsonb', nullable: true })
  newData: any;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
}
