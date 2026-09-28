import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Verify2faDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã xác thực OTP 6 chữ số' })
  @Length(6, 6, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  code: string;
}
