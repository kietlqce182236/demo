import { PartialType } from '@nestjs/swagger';
import { CreateChildDto } from './create-child.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateChildDto extends PartialType(CreateChildDto) {
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'])
  status?: string;
}
