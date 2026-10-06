import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';

export class UpdateSnackServiceDto {
  @ApiPropertyOptional({ description: 'Tên gói dịch vụ ăn xế' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết gói dịch vụ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Loại dịch vụ',
    enum: ['AFTER_SCHOOL_SNACK', 'PREMIUM_MILK', 'ORGANIC_FRUIT', 'CUSTOM_NUTRITION', 'DAYBOARDING_STANDARD', 'BREAKFAST', 'LATE_PICKUP', 'FACILITIES_CARE'],
  })
  @IsOptional()
  @IsIn(['AFTER_SCHOOL_SNACK', 'PREMIUM_MILK', 'ORGANIC_FRUIT', 'CUSTOM_NUTRITION', 'DAYBOARDING_STANDARD', 'BREAKFAST', 'LATE_PICKUP', 'FACILITIES_CARE'])
  serviceType?: string;

  @ApiPropertyOptional({
    description: 'Chu kỳ tính phí',
    enum: ['DAILY', 'PER_MEAL', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY'],
  })
  @IsOptional()
  @IsIn(['DAILY', 'PER_MEAL', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY'])
  billingCycle?: string;

  @ApiPropertyOptional({ description: 'Đơn giá 1 suất / 1 ngày (VNĐ)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu áp dụng (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc áp dụng (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  availableTo?: string;
}
