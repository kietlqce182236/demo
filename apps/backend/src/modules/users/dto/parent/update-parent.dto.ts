import { IsOptional, IsString, IsArray, IsUUID } from 'class-validator';

export class UpdateParentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  childIds?: string[];
}
