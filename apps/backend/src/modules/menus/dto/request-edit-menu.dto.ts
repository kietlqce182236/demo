import { IsString, IsNotEmpty } from 'class-validator';

export class RequestEditMenuDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do cần xin phép chỉnh sửa thực đơn' })
  reason: string;
}
