import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class AdjustDishDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1 = Thứ 2, ..., 5 = Thứ 6

  @IsString()
  @IsNotEmpty()
  mealTime: string; // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, LATE_SNACK

  @IsString()
  @IsNotEmpty()
  dishId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  portionSizeG?: number = 100;

  @IsString()
  @IsOptional()
  substituteDishId?: string;

  @IsString()
  @IsOptional()
  specialDietNotes?: string;
}
