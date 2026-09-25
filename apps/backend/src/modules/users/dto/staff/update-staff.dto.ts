import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';

export class UpdateStaffDto {
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ và tên tối thiểu 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên tối đa 100 ký tự' })
  @IsOptional()
  fullName?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  phone?: string;

  @IsArray({ message: 'Danh sách vai trò phải là mảng' })
  @IsString({ each: true, message: 'Mã vai trò phải là chuỗi ký tự' })
  @IsOptional()
  roleCodes?: string[];

  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  @IsOptional()
  newPassword?: string;
}
