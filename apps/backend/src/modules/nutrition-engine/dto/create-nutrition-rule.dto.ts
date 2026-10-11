import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNutritionRuleDto {
  @ApiPropertyOptional({ example: 'MAU_GIAO' })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ example: 'MAU_GIAO' })
  @IsOptional()
  @IsString()
  targetAgeGroup?: string;

  @ApiPropertyOptional({ example: 'Quy chuẩn dinh dưỡng mẫu giáo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'FULL_DAY' })
  @IsOptional()
  @IsString()
  mealScope?: string;

  @ApiPropertyOptional({ example: 615 })
  @IsOptional()
  @IsNumber()
  minEnergyKcal?: number;

  @ApiPropertyOptional({ example: 615 })
  @IsOptional()
  @IsNumber()
  minCaloriesKcal?: number;

  @ApiPropertyOptional({ example: 738 })
  @IsOptional()
  @IsNumber()
  maxEnergyKcal?: number;

  @ApiPropertyOptional({ example: 738 })
  @IsOptional()
  @IsNumber()
  maxCaloriesKcal?: number;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsNumber()
  minProteinPct?: number;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsNumber()
  minProteinPercent?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  maxProteinPct?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  maxProteinPercent?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  minFatPct?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  minFatPercent?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsNumber()
  maxFatPct?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsNumber()
  maxFatPercent?: number;

  @ApiPropertyOptional({ example: 52 })
  @IsOptional()
  @IsNumber()
  minCarbPct?: number;

  @ApiPropertyOptional({ example: 52 })
  @IsOptional()
  @IsNumber()
  minCarbPercent?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  maxCarbPct?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  maxCarbPercent?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  minCalciumMg?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  minIronMg?: number;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  minZincMg?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsNumber()
  maxSodiumMg?: number;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  caPRatioMin?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  caPRatioMax?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isStrict?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
