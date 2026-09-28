import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExcelMenuItemDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6

  @IsString()
  @IsNotEmpty()
  mealTime: string; // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, LATE_SNACK

  @IsString()
  @IsNotEmpty()
  dishName: string;

  @IsString()
  @IsOptional()
  dishType?: string; // MAIN_COURSE, SOUP, SIDE_VEGETABLE, RICE_STAPLE, DESSERT, etc.

  @IsNumber()
  @IsOptional()
  portionSizeG?: number = 100;

  @IsNumber()
  @IsOptional()
  calories?: number;
}

export class ImportExcelMenuDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  targetAgeGroup?: string = 'ALL_AGES';

  @IsNumber()
  @IsOptional()
  cycleWeekNumber?: number = 1;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelMenuItemDto)
  items: ExcelMenuItemDto[];
}
