import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'hieutruong@huongduong.edu.vn', description: 'Email hoặc tên đăng nhập' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu tài khoản' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Mã xác thực 2 bước (nếu có)' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
