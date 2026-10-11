import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RotateCycleMenuDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  cycleId: number;

  @ApiProperty({ example: '2025-09-15' })
  @IsNotEmpty()
  @IsString()
  targetWeekStartDate: string;
}
