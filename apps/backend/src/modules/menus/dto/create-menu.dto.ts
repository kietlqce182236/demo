import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDishItemDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1: Thứ 2 ... 5: Thứ 6

  @IsString()
  @IsNotEmpty()
  mealTime: string; // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, LATE_SNACK

  @IsString()
  @IsNotEmpty()
  dishId: string;

  @IsNumber()
  @IsOptional()
  portionSizeG?: number;

  @IsString()
  @IsOptional()
  substituteDishId?: string;

  @IsString()
  @IsOptional()
  specialDietNotes?: string;
}

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  menuCycleType?: string = 'WEEKLY';

  @IsString()
  @IsOptional()
  targetAgeGroup?: string = 'ALL_AGES';

  @IsString()
  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  endDate: string; // YYYY-MM-DD

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(52)
  cycleWeekNumber?: number = 1;

  @IsString()
  @IsOptional()
  parentMenuId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuDishItemDto)
  dishes?: CreateMenuDishItemDto[];
}
