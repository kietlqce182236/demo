import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DishEvaluationItem {
  @ApiProperty({ example: 1 })
  @IsNumber()
  dishId: number;

  @ApiPropertyOptional({ example: 'MORNING_SNACK' })
  @IsOptional()
  @IsString()
  mealType?: string;
}

export class EvaluateMenuDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  menuId?: number;

  @ApiPropertyOptional({ example: 'MAU_GIAO', enum: ['NHA_TRE', 'MAU_GIAO'] })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ example: 'MAU_GIAO' })
  @IsOptional()
  @IsString()
  targetAgeGroup?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  ruleId?: string;

  @ApiPropertyOptional({ example: '2026-10-10' })
  @IsOptional()
  @IsString()
  targetDate?: string;

  @ApiPropertyOptional({ type: [DishEvaluationItem] })
  @IsOptional()
  @IsArray()
  dishes?: DishEvaluationItem[];
}
