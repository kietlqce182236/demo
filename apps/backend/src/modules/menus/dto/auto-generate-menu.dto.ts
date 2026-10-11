import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AutoGenerateMenuDto {
  @ApiPropertyOptional({ example: 'MAU_GIAO' })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiPropertyOptional({ example: 'MAU_GIAO' })
  @IsOptional()
  @IsString()
  targetAgeGroup?: string;

  @ApiPropertyOptional({ example: '2026-10-12' })
  @IsOptional()
  @IsString()
  weekStartDate?: string;

  @ApiPropertyOptional({ example: '2026-10-12' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-16' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Thực đơn AI sinh tự động theo chuẩn Thông tư 28' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  daysCount?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  cycleWeekNumber?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  excludePreviousDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeBreakfast?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  previewOnly?: boolean;

  @ApiPropertyOptional({ description: 'Kế hoạch các ngày đã xem trước để lưu chính xác' })
  @IsOptional()
  dailyPlan?: any[];
}
