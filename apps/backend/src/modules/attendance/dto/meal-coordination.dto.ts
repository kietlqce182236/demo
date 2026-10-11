import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MealCoordinationDto {
  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ example: 'Hôm nay bé Gia Huy ăn chậm, cần cô hỗ trợ xúc cơm' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
