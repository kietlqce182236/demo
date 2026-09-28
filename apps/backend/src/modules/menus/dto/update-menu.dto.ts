import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  targetAgeGroup?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(52)
  cycleWeekNumber?: number;
}
