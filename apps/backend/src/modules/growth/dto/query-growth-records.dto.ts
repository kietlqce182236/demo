import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryGrowthRecordsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  childId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ enum: ['NORMAL', 'UNDERWEIGHT', 'OVERWEIGHT', 'OBESE', 'STUNTED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['NORMAL', 'UNDERWEIGHT', 'OVERWEIGHT', 'OBESE', 'STUNTED'] })
  @IsOptional()
  @IsString()
  nutritionalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
}
