import { IsString, IsOptional, IsUUID, IsIn, IsDateString } from 'class-validator';

export class DeclareAllergyDto {
  @IsOptional()
  @IsUUID()
  allergenId?: string;

  @IsOptional()
  @IsString()
  customAllergenName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ALLERGY', 'INTOLERANCE', 'RELIGIOUS_RESTRICTION', 'MEDICAL_RESTRICTION'])
  allergyType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'])
  severity?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  reactionTreatment?: string;

  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @IsOptional()
  @IsString()
  medicalCertificateUrl?: string;
}
