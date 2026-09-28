import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNutritionRuleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(
    ['TODDLER_18_36M', 'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y', 'ALL_AGES'],
    { message: 'Nhóm tuổi không hợp lệ' },
  )
  @IsOptional()
  targetAgeGroup?: string;

  @IsString()
  @IsIn(['FULL_DAY_SCHOOL', 'LUNCH_ONLY', 'SNACK_ONLY', 'PER_MEAL'])
  @IsOptional()
  mealScope?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCaloriesKcal?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxCaloriesKcal?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minProteinPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxProteinPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minFatPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxFatPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minCarbPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxCarbPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCalciumMg?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minIronMg?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minZincMg?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSodiumMg?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  caPRatioMin?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  caPRatioMax?: number;

  @IsBoolean()
  @IsOptional()
  isStrict?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
