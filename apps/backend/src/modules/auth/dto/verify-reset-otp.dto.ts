import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email' })
  email: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mã xác thực OTP' })
  @Length(6, 6, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  @Matches(/^[0-9]{6}$/, { message: 'Mã xác thực OTP chỉ bao gồm các chữ số' })
  otp: string;
}
