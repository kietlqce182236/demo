import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSnackServicePeriodDto {
  @ApiProperty({ example: 'Dịch vụ ăn xế Tháng 10/2025' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-10-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-10-31' })
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ example: '2025-09-28' })
  @IsOptional()
  @IsString()
  registrationDeadline?: string;

  @ApiProperty({ example: 440000 })
  @IsNumber()
  feeAmount: number;
}
