import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyRotateDishDto {
  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ example: 'LUNCH' })
  @IsNotEmpty()
  @IsString()
  mealType: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  oldDishId: number;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsNumber()
  newDishId: number;

  @ApiPropertyOptional({ example: 'Thiếu nguyên liệu tươi sáng nay' })
  @IsOptional()
  @IsString()
  reason?: string;
}
