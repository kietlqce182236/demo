import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSampleItemDto {
  @IsString()
  @IsNotEmpty()
  dishId: string;

  @IsString()
  @IsNotEmpty()
  dishName: string;

  @IsNumber()
  quantityGrams: number;
}

export class Step1Dto {
  @IsString()
  @IsNotEmpty()
  mealDate: string;

  @IsString()
  @IsNotEmpty()
  mealTime: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  photoBase64?: string;
}

export class Step2Dto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  photoBase64?: string;
}

export class Step3Dto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  photoBase64?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSampleItemDto)
  items: CreateSampleItemDto[];
}
