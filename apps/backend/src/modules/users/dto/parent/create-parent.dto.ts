import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ example: 'phuhuynh.moi@gmail.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'Nguyễn Văn Ba' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '0909888777' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Cách Mạng Tháng 8, Q.3, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Kỹ sư xây dựng' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: [1, 2], type: [Number] })
  @IsOptional()
  @IsArray()
  childIds?: (string | number)[];
}
