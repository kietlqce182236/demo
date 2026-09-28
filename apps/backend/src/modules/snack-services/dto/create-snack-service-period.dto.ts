import { IsString, IsBoolean, IsArray, IsOptional, IsNumber, IsEnum, IsDateString, IsInt, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSnackServicePeriodDto {
  @ApiProperty({ description: 'ID của gói ăn xế (snack_services.id)', example: '55100000-0000-0000-0000-000000000001' })
  @IsString()
  snackServiceId: string;

  @ApiProperty({ description: 'Mã đợt đăng ký', example: 'XGC-2024-T12' })
  @IsString()
  periodCode: string;

  @ApiProperty({ description: 'Danh sách khối lớp áp dụng', example: ['KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y'] })
  @IsArray()
  @IsString({ each: true })
  appliedGrades: string[];

  @ApiPropertyOptional({ description: 'Áp dụng toàn trường', default: false })
  @IsBoolean()
  @IsOptional()
  isWholeSchool?: boolean;

  @ApiProperty({ description: 'Ngày bắt đầu nhận đơn', example: '2024-12-01' })
  @IsDateString()
  registrationStart: string;

  @ApiProperty({ description: 'Ngày kết thúc nhận đơn', example: '2024-12-15' })
  @IsDateString()
  registrationEnd: string;

  @ApiProperty({ description: 'Tháng phục vụ bữa xế', example: ['2024-12', '2025-01'] })
  @IsArray()
  @IsString({ each: true })
  serviceMonths: string[];

  @ApiProperty({ description: 'Đơn giá / suất / bé / ngày (VNĐ)', example: 18000 })
  @IsNumber()
  pricePerUnitPerDay: number;

  @ApiPropertyOptional({ description: 'Bật tự động hoàn tiền', default: false })
  @IsBoolean()
  @IsOptional()
  autoRefundEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Chế độ công suất: UNLIMITED hoặc LIMITED', default: 'UNLIMITED' })
  @IsOptional()
  @IsString()
  capacityMode?: string;

  @ApiPropertyOptional({ description: 'Công suất bếp (suất)', example: 160 })
  @IsOptional()
  @IsInt()
  kitchenCapacity?: number;

  @ApiPropertyOptional({ description: 'Tổng chỉ tiêu toàn trường', example: 160 })
  @IsOptional()
  @IsInt()
  totalQuota?: number;

  @ApiPropertyOptional({ description: 'Phân bổ chỉ tiêu theo khối', example: { 'KINDERGARTEN_4_5Y': 50, 'KINDERGARTEN_5_6Y': 55 } })
  @IsOptional()
  @IsObject()
  quotaPerGrade?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Bật tự động đóng khi đạt threshold', default: false })
  @IsBoolean()
  @IsOptional()
  autoCloseEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Ngưỡng tự động đóng (%)', example: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  autoCloseThresholdPercent?: number;

  @ApiPropertyOptional({ description: 'Ghi chú dinh dưỡng & mục đích' })
  @IsOptional()
  @IsString()
  nutritionNotes?: string;

  @ApiPropertyOptional({ description: 'Trạng thái: DRAFT hoặc ACTIVE', default: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}
