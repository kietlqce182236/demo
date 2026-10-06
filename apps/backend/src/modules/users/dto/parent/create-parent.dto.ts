import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';

export class CreateParentDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  childIds?: string[];
}
