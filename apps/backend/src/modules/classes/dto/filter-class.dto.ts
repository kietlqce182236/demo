import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['NHA_TRE', 'MAU_GIAO'] })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: any;

  @ApiPropertyOptional()
  @IsOptional()
  page?: any;

  @ApiPropertyOptional()
  @IsOptional()
  gradeLevel?: any;

  @ApiPropertyOptional()
  @IsOptional()
  academicYear?: any;
}
