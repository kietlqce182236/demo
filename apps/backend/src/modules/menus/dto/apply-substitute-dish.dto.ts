import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplySubstituteDishDto {
  @ApiProperty({ description: 'ID của món thay thế an toàn (null nếu muốn hủy)', required: false })
  @IsOptional()
  @IsString({ message: 'ID món thay thế không hợp lệ' })
  substituteDishId?: string | null;

  @ApiProperty({ description: 'Ghi chú chế độ ăn đặc biệt / dị ứng', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
