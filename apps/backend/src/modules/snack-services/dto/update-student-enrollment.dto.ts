import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateStudentEnrollmentDto {
  @ApiProperty({ description: 'ID học sinh' })
  @IsNotEmpty()
  @IsString()
  childId: string;

  @ApiPropertyOptional({ description: 'Đăng ký bán trú tiêu chuẩn (trưa + ngủ trưa)' })
  @IsOptional()
  @IsBoolean()
  isDayboarding?: boolean;

  @ApiPropertyOptional({ description: 'Đăng ký ăn sáng tại trường' })
  @IsOptional()
  @IsBoolean()
  isBreakfast?: boolean;

  @ApiPropertyOptional({ description: 'Đăng ký ăn xế chiều 17h' })
  @IsOptional()
  @IsBoolean()
  isSnack17h?: boolean;

  @ApiPropertyOptional({ description: 'Đăng ký trông trẻ ngoài giờ (đón muộn)' })
  @IsOptional()
  @IsBoolean()
  isLatePickup?: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú chế độ ăn kiêng / dị ứng riêng' })
  @IsOptional()
  @IsString()
  dietaryNotes?: string;
}
