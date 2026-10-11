import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFoodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  energyKcal100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  proteinG?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fatG?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  carbG?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fiberG?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  calciumMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ironMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  zincMg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  refuseRatePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
