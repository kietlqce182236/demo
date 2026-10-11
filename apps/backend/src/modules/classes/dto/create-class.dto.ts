import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Lớp Mầm 1' })
  @IsNotEmpty({ message: 'Tên lớp không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'NHA_TRE', enum: ['NHA_TRE', 'MAU_GIAO'] })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({ example: '2025-2026' })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  homeroomTeacherId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  mainTeacherId?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
