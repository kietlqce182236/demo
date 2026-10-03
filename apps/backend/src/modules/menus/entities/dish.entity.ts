import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RecipeItem } from '../../dishes/entities/recipe-item.entity';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'dish_category', type: 'varchar', length: 50, nullable: true })
  dishCategory: string;

  @Column({ name: 'approval_status', type: 'varchar', length: 30, default: 'APPROVED' })
  approvalStatus: string;

  /**
   * MAIN_COURSE | SOUP | SIDE_VEGETABLE | RICE_STAPLE | PORRIDGE_NOODLE | DESSERT | SNACK_AFTERNOON | DRINK
   */
  @Column({ name: 'dish_type', type: 'varchar', length: 50 })
  dishType: string;

  /**
   * TODDLER_18_36M | KINDERGARTEN_3_5Y | ALL_AGES
   */
  @Column({ name: 'target_age_group', type: 'varchar', length: 50, default: 'ALL_AGES' })
  targetAgeGroup: string;

  @Column({ name: 'standard_serving_size_g', type: 'numeric', precision: 8, scale: 2, default: 100 })
  standardServingSizeG: number;

  @Column({ name: 'total_calories', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalCalories: number;

  @Column({ name: 'total_protein_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalProteinG: number;

  @Column({ name: 'total_fat_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalFatG: number;

  @Column({ name: 'total_carb_g', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalCarbG: number;

  @Column({ name: 'total_calcium_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalCalciumMg: number;

  @Column({ name: 'total_iron_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalIronMg: number;

  @Column({ name: 'total_zinc_mg', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalZincMg: number;

  @Column({ name: 'cooking_instructions', type: 'text', nullable: true })
  cookingInstructions: string | null;

  @Column({ name: 'presentation_notes', type: 'text', nullable: true })
  presentationNotes: string | null;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RecipeItem, (recipeItem) => recipeItem.dish, { cascade: true })
  recipeItems: RecipeItem[];
}
