import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespondEvaluationPayload {
  @ApiProperty({ example: 'Cảm ơn phụ huynh đã đóng góp ý kiến. Nhà trường đã ghi nhận và điều chỉnh định lượng.' })
  @IsNotEmpty()
  @IsString()
  responseContent: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  pushNotification?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  respondedByName?: string;

  @ApiPropertyOptional({ default: 'RESPONDED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDrafting?: boolean;
}
