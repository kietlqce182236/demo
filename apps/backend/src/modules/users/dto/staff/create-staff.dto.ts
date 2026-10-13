import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'giaovien.moi@huongduong.edu.vn' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'TEACHER', enum: ['MANAGEMENT', 'SPECIALIST', 'TEACHER', 'KITCHEN'] })
  @IsOptional()
  @IsString()
  staffType?: string;

  @ApiPropertyOptional({ example: 'Giáo viên phụ trách lớp Mầm' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'TEACHER', enum: ['SCHOOL_MANAGER', 'NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF'] })
  @IsOptional()
  @IsString()
  roleCode?: string;

  @ApiPropertyOptional({ example: ['TEACHER'], type: [String] })
  @IsOptional()
  @IsArray()
  roleCodes?: string[];

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
