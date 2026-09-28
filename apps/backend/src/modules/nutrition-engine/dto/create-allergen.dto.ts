import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class CreateAllergenDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã chất dị ứng không được để trống' })
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã chất dị ứng phải viết hoa và không dấu (ví dụ: COW_MILK, PEANUT)',
  })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên tiếng Việt không được để trống' })
  @MinLength(2)
  @MaxLength(150)
  nameVi: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  commonFoods?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
