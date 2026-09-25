import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class UpdateMealAttendanceDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  mealOption: 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY' | 'ABSENT';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  kitchenStatus?: 'SYNCED' | 'PENDING' | 'CANCELLED';
}

export class BatchMarkAllPresentDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  mealOption?: 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY';
}

export class SyncFromMorningCheckinDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  date: string;
}

export class LockAndSendToKitchenDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
