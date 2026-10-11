import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({ example: 'Thịt bò phi lê' })
  @IsNotEmpty({ message: 'Tên nguyên liệu không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ default: 'g' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 182 })
  @IsOptional()
  @IsNumber()
  energyKcal100g?: number;

  @ApiPropertyOptional({ example: 21.5 })
  @IsOptional()
  @IsNumber()
  proteinG?: number;

  @ApiPropertyOptional({ example: 10.7 })
  @IsOptional()
  @IsNumber()
  fatG?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  carbG?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  fiberG?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  calciumMg?: number;

  @ApiPropertyOptional({ example: 3.1 })
  @IsOptional()
  @IsNumber()
  ironMg?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  zincMg?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  refuseRatePercent?: number;

  @ApiPropertyOptional({ default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
