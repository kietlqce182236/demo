import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryStaffDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  roleCode?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return false;
  })
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean = false;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsIn(['fullName', 'email', 'createdAt', 'lastLoginAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
