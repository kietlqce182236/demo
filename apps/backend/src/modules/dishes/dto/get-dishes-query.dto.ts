import { IsOptional, IsString, IsBooleanString, IsNumberString } from 'class-validator';

export class GetDishesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dishType?: string;

  @IsOptional()
  @IsString()
  targetAgeGroup?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
