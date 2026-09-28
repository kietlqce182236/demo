import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ và tên tối thiểu 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên tối đa 100 ký tự' })
  @IsOptional()
  fullName?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  @IsOptional()
  avatarUrl?: string;
}
