import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGrowthRecordDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  studentId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  childId?: number | string;

  @ApiPropertyOptional({ example: '2025-09-08' })
  @IsOptional()
  measuredDate?: string;

  @ApiPropertyOptional({ example: '2025-09-08' })
  @IsOptional()
  measurementDate?: string;

  @ApiProperty({ example: 102.5 })
  @IsNotEmpty()
  @IsNumber()
  heightCm: number;

  @ApiProperty({ example: 16.2 })
  @IsNotEmpty()
  @IsNumber()
  weightKg: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthNotes?: string;
}
