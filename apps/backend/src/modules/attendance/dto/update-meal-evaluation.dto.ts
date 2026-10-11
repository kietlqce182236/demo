import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMealEvaluationDto {
  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'LUNCH' })
  @IsOptional()
  @IsString()
  mealType?: string;

  @ApiProperty({ example: 'FULL', enum: ['FULL', 'PARTIAL', 'NONE'] })
  @IsNotEmpty()
  @IsString()
  portionConsumed: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waterIntake?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  syncStatus?: string;
}
