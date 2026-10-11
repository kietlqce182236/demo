import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'giaovien.moi@huongduong.edu.vn' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'TEACHER', enum: ['MANAGEMENT', 'SPECIALIST', 'TEACHER', 'KITCHEN'] })
  @IsNotEmpty()
  @IsString()
  staffType: string;

  @ApiPropertyOptional({ example: 'Giáo viên phụ trách lớp Mầm' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: 'TEACHER', enum: ['SCHOOL_MANAGER', 'NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF'] })
  @IsNotEmpty()
  @IsString()
  roleCode: string;
}
