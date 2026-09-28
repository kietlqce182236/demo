import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsArray, ValidateIf } from 'class-validator';

export class MealCoordinationQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  mealSession?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  noteType?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateMealCoordinationNoteDto {
  @IsString()
  classId: string;

  @IsOptional()
  @IsString()
  childId?: string;

  @IsString()
  mealDate: string;

  @IsString()
  mealSession: string; // 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_SNACK' | 'ALL_DAY'

  @IsString()
  noteType: string; // 'PORTION_ADJUSTMENT' | 'ALLERGY_WARNING' | 'MEDICATION_FEEDING' | 'SPECIAL_DIET' | 'KITCHEN_REQUEST' | 'PARENT_DIRECTIVE' | 'GENERAL_OBSERVATION'

  @IsString()
  priority: string; // 'URGENT' | 'HIGH' | 'NORMAL'

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  targetRole?: string; // 'KITCHEN' | 'HEALTH_OFFICER' | 'PRINCIPAL' | 'PARENT'

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class UpdateMealCoordinationNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  noteType?: string;

  @IsOptional()
  @IsString()
  mealSession?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  kitchenResponse?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class AcknowledgeCoordinationDto {
  @IsOptional()
  @IsString()
  acknowledgedBy?: string;

  @IsOptional()
  @IsString()
  kitchenResponse?: string;
}

export class ResolveCoordinationDto {
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
