import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Language } from './language.entity';

@Entity('ui_translations')
@Unique(['languageId', 'namespace', 'translationKey'])
export class UiTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'language_id', type: 'bigint', transformer: BigIntTransformer })
  languageId: number;

  @Column({ length: 50, default: 'common' })
  namespace: string;

  @Column({ name: 'translation_key', length: 255 })
  translationKey: string;

  @Column({ name: 'translation_value', type: 'text' })
  translationValue: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Language, (lang) => lang.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
