import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';

@Entity('schools')
export class SchoolTenant {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: 'principal_name', length: 150, nullable: true })
  principalName: string;

  @Column({ length: 500, nullable: true })
  logo: string;
}
