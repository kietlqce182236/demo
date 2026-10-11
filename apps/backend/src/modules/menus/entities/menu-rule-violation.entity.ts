import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { MenuVersion } from './menu-version.entity';

@Entity('menu_rule_violations')
export class MenuRuleViolation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_version_id', type: 'bigint', transformer: BigIntTransformer })
  menuVersionId: number;

  @Column({ name: 'rule_code', length: 50 })
  ruleCode: string;

  @Column({ length: 20, default: 'WARNING' })
  severity: string;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => MenuVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_version_id' })
  menuVersion: MenuVersion;
}
