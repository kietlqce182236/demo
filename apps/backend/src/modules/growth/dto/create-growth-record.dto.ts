import { IsNotEmpty, IsUUID, IsNumber, IsDateString, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateGrowthRecordDto {
  @IsNotEmpty()
  @IsUUID()
  childId: string;

  @IsNotEmpty()
  @IsDateString()
  measurementDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(2)
  @Max(80)
  weightKg: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(40)
  @Max(160)
  heightCm: number;

  @IsOptional()
  @IsString()
  healthNotes?: string;
}
