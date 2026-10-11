import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNutritionRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetAgeGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mealScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minEnergyKcal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minCaloriesKcal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxEnergyKcal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxCaloriesKcal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minProteinPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minProteinPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxProteinPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxProteinPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minFatPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minFatPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxFatPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxFatPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minCarbPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minCarbPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxCarbPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxCarbPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minCalciumMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minIronMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minZincMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxSodiumMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  caPRatioMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  caPRatioMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStrict?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
