import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}

export class Verify2FaDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã xác thực 2FA không được để trống' })
  code: string;
}
