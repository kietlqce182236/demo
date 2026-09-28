import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsString()
  foodId: string;

  @IsNumber()
  netWeightPerPortionG: number;

  @IsNumber()
  @IsOptional()
  grossWeightPerPortionG?: number;

  @IsNumber()
  @IsOptional()
  shrinkageRatio?: number;

  @IsString()
  @IsOptional()
  prepNotes?: string;
}

export class CreateDishDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  dishType?: string;

  @IsString()
  @IsOptional()
  targetAgeGroup?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  cookingInstructions?: string;

  @IsString()
  @IsOptional()
  presentationNotes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  standardServingSizeG?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  recipeItems: RecipeItemDto[];
}
