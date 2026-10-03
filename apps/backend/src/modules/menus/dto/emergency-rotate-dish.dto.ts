import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

export class EmergencyRotateDishDto {
  @IsNotEmpty()
  @IsUUID()
  substituteDishId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  reportedBy?: string;
}
