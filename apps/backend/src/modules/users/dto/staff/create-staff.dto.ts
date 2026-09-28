import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';

export class CreateStaffDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MinLength(2, { message: 'Họ và tên tối thiểu 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên tối đa 100 ký tự' })
  fullName: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu khởi tạo tối thiểu 6 ký tự' })
  @IsOptional()
  password?: string;

  @IsArray({ message: 'Danh sách vai trò phải là mảng' })
  @ArrayNotEmpty({ message: 'Phải chọn ít nhất 1 vai trò chuyên môn' })
  @IsString({ each: true, message: 'Mã vai trò phải là chuỗi ký tự' })
  roleCodes: string[];

  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: string = 'ACTIVE';
}
