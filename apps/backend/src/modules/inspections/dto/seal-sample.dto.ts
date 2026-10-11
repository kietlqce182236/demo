import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SealSampleDto {
  @ApiProperty({ example: 'Thịt bò xào đậu cô ve' })
  @IsNotEmpty()
  @IsString()
  dishName: string;

  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'MẪU-20250908-01' })
  @IsOptional()
  @IsString()
  sampleCode?: string;

  @ApiPropertyOptional({ example: 'Nhiệt độ lưu trữ 4°C, niêm phong kín' })
  @IsOptional()
  @IsString()
  note?: string;
}
