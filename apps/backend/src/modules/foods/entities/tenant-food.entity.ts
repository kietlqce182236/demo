import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Food } from './food.entity';

@Entity('tenant_foods')
export class TenantFood {
  @PrimaryColumn({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @PrimaryColumn({ name: 'food_id', type: 'uuid' })
  foodId: string;

  @CreateDateColumn({ name: 'activated_at', type: 'timestamptz' })
  activatedAt: Date;

  @Column({ name: 'activated_by', type: 'uuid', nullable: true })
  activatedBy: string;

  @ManyToOne(() => Food, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food: Food;
}
