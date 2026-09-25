import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAllergenDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @IsOptional()
  nameVi?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  commonFoods?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
