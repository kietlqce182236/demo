import { IsOptional, IsString, IsUUID, IsNumberString } from 'class-validator';

export class MealEvaluationQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  mealType?: string; // 'LUNCH' | 'AFTERNOON_SNACK'

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
