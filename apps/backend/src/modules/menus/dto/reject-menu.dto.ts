import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectMenuDto {
  @ApiProperty({ example: 'Cần bổ sung thêm rau xanh cho bữa trưa thứ Ba và thứ Năm' })
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  @IsString()
  rejectionReason: string;
}
