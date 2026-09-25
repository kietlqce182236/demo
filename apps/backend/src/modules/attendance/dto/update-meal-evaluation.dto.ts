import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsIn } from 'class-validator';

export class UpdateChildEvaluationDto {
  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  mealType?: string; // 'LUNCH' | 'AFTERNOON_SNACK'

  @IsNotEmpty()
  @IsIn(['ALL', 'HALF', 'NONE', 'QUARTER', 'DOUBLE_PORTION'])
  portionConsumed: string;

  @IsOptional()
  @IsString()
  waterIntake?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  syncStatus?: string;
}

export class BatchUpdatePortionDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsArray()
  childIds?: string[]; // If empty, apply to all active children in class

  @IsNotEmpty()
  @IsIn(['ALL', 'HALF', 'NONE'])
  portionConsumed: string;
}

export class UpdateSensoryEvaluationDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsNumber()
  softnessScore?: number;

  @IsOptional()
  @IsNumber()
  temperatureScore?: number;

  @IsOptional()
  @IsNumber()
  excitementScore?: number;

  @IsOptional()
  @IsBoolean()
  foodSafetyChecked?: boolean;

  @IsOptional()
  @IsString()
  chefFeedback?: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}

export class LockAndSendEvaluationDto {
  @IsNotEmpty()
  @IsString()
  classId: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsString()
  chefFeedback?: string;
}
