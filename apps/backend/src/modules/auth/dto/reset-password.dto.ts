import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token xác thực đặt lại mật khẩu' })
  @IsNotEmpty({ message: 'Reset token không được để trống' })
  @IsString()
  resetToken: string;

  @ApiProperty({ example: 'NewSecret@2026', description: 'Mật khẩu mới' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @IsString()
  newPassword: string;
}
