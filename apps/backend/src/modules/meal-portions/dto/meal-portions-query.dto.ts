import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MealPortionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weekNumber?: number = 14;

  @IsOptional()
  @IsString()
  schoolYear?: string = 'Năm học 2024 - 2025 - Học kỳ 1';
}

export class ApproveWarehouseExportDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
