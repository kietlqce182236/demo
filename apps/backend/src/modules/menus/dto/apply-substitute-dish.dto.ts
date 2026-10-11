import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplySubstituteDishDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  studentId: number;

  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ example: 'LUNCH' })
  @IsNotEmpty()
  @IsString()
  mealType: string;

  @ApiProperty({ example: 4 })
  @IsNotEmpty()
  @IsNumber()
  substituteDishId: number;

  @ApiPropertyOptional({ example: 'Thay thế cho bé dị ứng hải sản' })
  @IsOptional()
  @IsString()
  reason?: string;
}
