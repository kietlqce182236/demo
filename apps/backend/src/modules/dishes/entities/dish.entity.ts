import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RecipeItem } from './recipe-item.entity';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'dish_type', type: 'varchar', length: 50, nullable: true })
  dishType: string;

  @Column({ name: 'target_age_group', type: 'varchar', length: 50, nullable: true })
  targetAgeGroup: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string;

  @Column({ name: 'cooking_instructions', type: 'text', nullable: true })
  cookingInstructions: string;

  @Column({ name: 'presentation_notes', type: 'text', nullable: true })
  presentationNotes: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'total_calories', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalCalories: number;

  @Column({ name: 'total_protein_g', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalProteinG: number;

  @Column({ name: 'total_fat_g', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalFatG: number;

  @Column({ name: 'total_carb_g', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalCarbG: number;

  @Column({ name: 'total_calcium_mg', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalCalciumMg: number;

  @Column({ name: 'total_iron_mg', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalIronMg: number;

  @Column({ name: 'total_zinc_mg', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalZincMg: number;

  @Column({ name: 'standard_serving_size_g', type: 'numeric', precision: 10, scale: 2, default: 0 })
  standardServingSizeG: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RecipeItem, recipeItem => recipeItem.dish, { cascade: true })
  recipeItems: RecipeItem[];
}
