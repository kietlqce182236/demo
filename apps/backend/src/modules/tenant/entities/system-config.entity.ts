import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'config_key', length: 100, unique: true })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', nullable: true })
  configValue: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
