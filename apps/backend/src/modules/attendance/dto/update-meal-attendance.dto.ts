import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMealAttendanceDto {
  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ example: 'PRESENT' })
  @IsNotEmpty()
  mealOption: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
