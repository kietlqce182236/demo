import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MealPortionsQueryDto {
  @ApiPropertyOptional({ example: '2025-09-08' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 'LUNCH' })
  @IsOptional()
  @IsString()
  mealType?: string;
}
