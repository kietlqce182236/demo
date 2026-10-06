import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class AttendanceQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  mealFilter?: 'ALL' | 'LUNCH' | 'SNACK' | 'ABSENT' | 'PRESENT';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
