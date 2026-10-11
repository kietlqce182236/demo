import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChildDto {
  @ApiProperty({ example: 'Nguyễn Gia Huy' })
  @IsNotEmpty({ message: 'Họ tên trẻ không được để trống' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '2020-03-15' })
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE'] })
  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  @IsString()
  gender: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  classId?: number;

  @ApiPropertyOptional({ example: 'HS-2024-001' })
  @IsOptional()
  @IsString()
  studentCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
