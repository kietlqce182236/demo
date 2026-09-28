import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum GradeLevel {
  INFANT_0_1Y = 'INFANT_0_1Y',
  TODDLER_1_2Y = 'TODDLER_1_2Y',
  TODDLER_2_3Y = 'TODDLER_2_3Y',
  KINDERGARTEN_3_4Y = 'KINDERGARTEN_3_4Y',
  KINDERGARTEN_4_5Y = 'KINDERGARTEN_4_5Y',
  KINDERGARTEN_5_6Y = 'KINDERGARTEN_5_6Y',
}

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(GradeLevel)
  @IsNotEmpty()
  gradeLevel: GradeLevel;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsOptional()
  mainTeacherId?: string;
}
