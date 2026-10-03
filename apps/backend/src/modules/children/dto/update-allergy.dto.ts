import { PartialType } from '@nestjs/swagger';
import { DeclareAllergyDto } from './declare-allergy.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateAllergyDto extends PartialType(DeclareAllergyDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
