import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsOptional()
  energyKcal?: number;

  @IsNumber()
  @IsOptional()
  proteinG?: number;

  @IsNumber()
  @IsOptional()
  fatG?: number;

  @IsNumber()
  @IsOptional()
  carbG?: number;

  @IsNumber()
  @IsOptional()
  fiberG?: number;

  @IsNumber()
  @IsOptional()
  calciumMg?: number;

  @IsNumber()
  @IsOptional()
  ironMg?: number;

  @IsNumber()
  @IsOptional()
  zincMg?: number;

  @IsNumber()
  @IsOptional()
  vitaminAMcg?: number;

  @IsNumber()
  @IsOptional()
  vitaminCMg?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergens?: string[];

  @IsString()
  @IsOptional()
  defaultUnit?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
