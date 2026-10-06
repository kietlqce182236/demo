import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsIn, Min, IsOptional } from 'class-validator';

export class CreateSnackServiceDto {
  @ApiProperty({ description: 'Tên gói dịch vụ bán trú / ăn xế' })
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết dịch vụ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Loại hình dịch vụ',
    enum: ['DAYBOARDING_STANDARD', 'BREAKFAST', 'AFTER_SCHOOL_SNACK', 'LATE_PICKUP', 'FACILITIES_CARE', 'PREMIUM_MILK', 'ORGANIC_FRUIT', 'CUSTOM_NUTRITION'],
    default: 'DAYBOARDING_STANDARD',
  })
  @IsNotEmpty()
  @IsIn(['DAYBOARDING_STANDARD', 'BREAKFAST', 'AFTER_SCHOOL_SNACK', 'LATE_PICKUP', 'FACILITIES_CARE', 'PREMIUM_MILK', 'ORGANIC_FRUIT', 'CUSTOM_NUTRITION'])
  serviceType: string;

  @ApiProperty({
    description: 'Chu kỳ tính phí',
    enum: ['DAILY', 'PER_MEAL', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY'],
    default: 'MONTHLY',
  })
  @IsNotEmpty()
  @IsIn(['DAILY', 'PER_MEAL', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY'])
  billingCycle: string;

  @ApiProperty({ description: 'Đơn giá định mức (VNĐ)' })
  @IsNotEmpty({ message: 'Đơn giá không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Đơn giá không được âm' })
  pricePerUnit: number;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
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
