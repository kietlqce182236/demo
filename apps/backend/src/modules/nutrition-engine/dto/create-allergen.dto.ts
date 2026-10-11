import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAllergenDto {
  @ApiPropertyOptional({ example: 'Sữa bò' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Sữa bò' })
  @IsOptional()
  @IsString()
  nameVi?: string;

  @ApiPropertyOptional({ example: 'Cow Milk' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ example: 'MILK' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Sữa tươi, phô mai, sữa chua, bơ' })
  @IsOptional()
  @IsString()
  commonFoods?: string;

  @ApiPropertyOptional({ example: 'Dị ứng protein sữa bò' })
  @IsOptional()
  @IsString()
  description?: string;
}
