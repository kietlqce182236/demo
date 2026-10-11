import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Menu } from './menu.entity';
import { MenuDay } from './menu-day.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('menu_versions')
export class MenuVersion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_id', type: 'bigint', transformer: BigIntTransformer })
  menuId: number;

  @Column({ name: 'version_number', default: 1 })
  versionNumber: number;

  @Column({ name: 'change_note', type: 'text', nullable: true })
  changeNote: string;

  @Column({ name: 'created_by', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Menu, (m) => m.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => MenuDay, (d) => d.menuVersion)
  days: MenuDay[];
}
