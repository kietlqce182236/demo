import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class AutoGenerateMenuDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  targetAgeGroup?: string = 'KINDERGARTEN_3_5Y';

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(6)
  daysCount?: number = 5;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(52)
  cycleWeekNumber?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  excludePreviousDays?: number = 14;

  @IsString()
  @IsOptional()
  referenceMenuId?: string;

  @IsBoolean()
  @IsOptional()
  includeBreakfast?: boolean = true;

  @IsBoolean()
  @IsOptional()
  previewOnly?: boolean = false;
}
