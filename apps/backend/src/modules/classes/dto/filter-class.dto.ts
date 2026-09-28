import { IsOptional, IsString, IsEnum } from 'class-validator';
import { GradeLevel } from './create-class.dto';
import { ClassStatus } from './update-class.dto';

export class FilterClassDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(GradeLevel)
  @IsOptional()
  gradeLevel?: GradeLevel;

  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;

  @IsString()
  @IsOptional()
  academicYear?: string;
  
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
