import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveMenuDto {
  @ApiPropertyOptional({ example: 'Thực đơn đạt chuẩn dinh dưỡng và đa dạng món' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
