import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ParentEvaluationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'ALL' | 'PENDING' | 'RESPONDED' | 'HAS_PHOTO'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  mealType?: string; // 'ALL' | 'LUNCH' | 'AFTERNOON_SNACK' | 'BREAKFAST' | 'STANDARD'

  @IsOptional()
  @IsString()
  gradeLevel?: string; // 'ALL' | 'KINDERGARTEN_3_4Y' | 'KINDERGARTEN_4_5Y' | 'KINDERGARTEN_5_6Y' | 'TODDLER_2_3Y'

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // 'NEWEST' | 'OLDEST' | 'RATING_HIGH' | 'RATING_LOW'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 4;
}
