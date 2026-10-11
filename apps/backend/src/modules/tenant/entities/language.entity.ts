import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { UiTranslation } from './ui-translation.entity';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 10, unique: true })
  code: string;

  @Column({ name: 'name_native', length: 100 })
  nameNative: string;

  @Column({ name: 'name_english', length: 100 })
  nameEnglish: string;

  @Column({ name: 'flag_icon', length: 10, nullable: true })
  flagIcon: string;

  @Column({ length: 3, default: 'LTR' })
  direction: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => UiTranslation, (t) => t.language)
  translations: UiTranslation[];
}
