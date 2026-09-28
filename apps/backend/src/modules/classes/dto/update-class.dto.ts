import { PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateClassDto extends PartialType(CreateClassDto) {
  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;
}
