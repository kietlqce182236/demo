import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({ example: 'Thực đơn tuần 01 - Học kỳ I (Tháng 9/2025)' })
  @IsNotEmpty({ message: 'Tiêu đề thực đơn không được để trống' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  weekStartDate: string;

  @ApiProperty({ example: '2025-09-12' })
  @IsNotEmpty()
  @IsString()
  weekEndDate: string;

  @ApiProperty({ example: 'MAU_GIAO', enum: ['NHA_TRE', 'MAU_GIAO'] })
  @IsNotEmpty()
  @IsString()
  ageGroup: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  cycleId?: number;

  @ApiPropertyOptional({ default: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  days?: any[];
}
