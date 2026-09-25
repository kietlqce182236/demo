import { IsString, IsOptional, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FoodSafetyLicenseDto {
  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  issuingAuthority?: string;
}

export class LegalRepresentativeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class BrandingDto {
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoName?: string;

  @IsString()
  @IsOptional()
  logoSize?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string; // 'TEAL' | 'YELLOW' | 'ORANGE'
}

export class UpdateTenantProfileDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  educationDepartmentCode?: string;

  @IsString()
  @IsOptional()
  schoolIdentifierSgd?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FoodSafetyLicenseDto)
  foodSafetyLicense?: FoodSafetyLicenseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LegalRepresentativeDto)
  legalRepresentative?: LegalRepresentativeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingDto)
  branding?: BrandingDto;
}
