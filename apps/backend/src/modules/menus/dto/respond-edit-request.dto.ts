import { IsString, IsOptional } from 'class-validator';

export class RespondEditRequestDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
