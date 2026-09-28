import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNutritionRuleDto {
  @IsString({ message: 'Tên quy chuẩn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên quy chuẩn không được để trống' })
  @MinLength(3, { message: 'Tên quy chuẩn tối thiểu 3 ký tự' })
  @MaxLength(255, { message: 'Tên quy chuẩn tối đa 255 ký tự' })
  name: string;

  @IsString()
  @IsIn(
    ['TODDLER_18_36M', 'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y', 'ALL_AGES'],
    { message: 'Nhóm tuổi không hợp lệ' },
  )
  targetAgeGroup: string;

  @IsString()
  @IsIn(['FULL_DAY_SCHOOL', 'LUNCH_ONLY', 'SNACK_ONLY', 'PER_MEAL'], {
    message: 'Phạm vi bữa ăn không hợp lệ',
  })
  @IsOptional()
  mealScope?: string = 'FULL_DAY_SCHOOL';

  @Type(() => Number)
  @IsNumber({}, { message: 'Năng lượng tối thiểu phải là số' })
  @Min(0, { message: 'Năng lượng tối thiểu không được âm' })
  minCaloriesKcal: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Năng lượng tối đa phải là số' })
  @Min(0, { message: 'Năng lượng tối đa không được âm' })
  maxCaloriesKcal: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Protein tối thiểu phải là số' })
  @Min(0)
  @Max(100)
  minProteinPercent: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Protein tối đa phải là số' })
  @Min(0)
  @Max(100)
  maxProteinPercent: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Lipid tối thiểu phải là số' })
  @Min(0)
  @Max(100)
  minFatPercent: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Lipid tối đa phải là số' })
  @Min(0)
  @Max(100)
  maxFatPercent: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Glucid tối thiểu phải là số' })
  @Min(0)
  @Max(100)
  minCarbPercent: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ Glucid tối đa phải là số' })
  @Min(0)
  @Max(100)
  maxCarbPercent: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCalciumMg?: number = 300;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minIronMg?: number = 4;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minZincMg?: number = 2.5;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSodiumMg?: number = 1500;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  caPRatioMin?: number = 1.0;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  caPRatioMax?: number = 1.5;

  @IsBoolean()
  @IsOptional()
  isStrict?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
