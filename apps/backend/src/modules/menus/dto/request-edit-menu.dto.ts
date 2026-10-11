import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEditMenuDto {
  @ApiProperty({ example: 'Cần điều chỉnh món phụ ngày thứ Tư' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
