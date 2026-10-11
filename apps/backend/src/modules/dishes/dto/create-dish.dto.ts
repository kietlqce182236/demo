import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeIngredientInput {
  @ApiProperty({ example: 1 })
  @IsNumber()
  ingredientId: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  grossWeightG?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  netWeightG: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateDishDto {
  @ApiProperty({ example: 'Thịt bò xào đậu cô ve' })
  @IsNotEmpty({ message: 'Tên món ăn không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'Món chính giàu sắt và đạm cho khối Chồi và Lá' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  standardServingSizeG?: number;

  @ApiPropertyOptional({ default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [RecipeIngredientInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInput)
  recipes?: RecipeIngredientInput[];
}
