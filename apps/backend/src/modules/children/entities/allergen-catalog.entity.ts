import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('allergen_catalogs')
export class AllergenCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ name: 'name_vi', length: 150 })
  nameVi: string;

  @Column({ name: 'name_en', length: 150 })
  nameEn: string;

  @Column({ name: 'common_foods', type: 'text', nullable: true })
  commonFoods: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
