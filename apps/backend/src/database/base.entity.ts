import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';

export const BigIntTransformer = {
  to: (value?: number | null): number | null => (value !== undefined && value !== null ? value : null),
  from: (value?: string | number | null): number | null => (value !== undefined && value !== null ? Number(value) : null),
};

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
