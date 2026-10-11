import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdjustDishDto {
  @ApiPropertyOptional({ example: 2, description: 'Thứ trong tuần: 1..7 hoặc 2..6' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: 'LUNCH', enum: ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'LATE_SNACK'] })
  @IsOptional()
  @IsString()
  mealType?: string;

  @ApiPropertyOptional({ example: 'LUNCH' })
  @IsOptional()
  @IsString()
  mealTime?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  oldDishId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  dishId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  newDishId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  substituteDishId?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  portionSizeG?: number;

  @ApiPropertyOptional({ example: 'Ghi chú chế độ ăn riêng' })
  @IsOptional()
  @IsString()
  specialDietNotes?: string;

  @ApiPropertyOptional({ example: true, description: 'Giữ nguyên món ăn gốc cho trẻ bình thường khi thêm món thay thế' })
  @IsOptional()
  keepOriginalDish?: boolean;
}
