import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng xác nhận lại mật khẩu mới' })
  confirmPassword: string;
}
