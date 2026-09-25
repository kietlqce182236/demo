import { IsUUID, IsOptional, IsString, IsIn } from 'class-validator';

export class EvaluateMenuDto {
  @IsUUID('4', { message: 'Menu ID phải là UUID hợp lệ' })
  @IsOptional()
  menuId?: string;

  @IsString()
  @IsIn(
    ['TODDLER_18_36M', 'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y', 'ALL_AGES'],
    { message: 'Nhóm tuổi không hợp lệ' },
  )
  @IsOptional()
  targetAgeGroup?: string;

  @IsUUID('4', { message: 'Rule ID phải là UUID hợp lệ' })
  @IsOptional()
  ruleId?: string;

  @IsString()
  @IsOptional()
  targetDate?: string;
}
