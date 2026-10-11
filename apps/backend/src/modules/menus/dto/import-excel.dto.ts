import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportExcelDto {
  @ApiPropertyOptional()
  @IsOptional()
  fileContentBase64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ example: 'MAU_GIAO' })
  @IsNotEmpty()
  @IsString()
  ageGroup: string;

  @ApiProperty({ example: '2025-09-08' })
  @IsNotEmpty()
  @IsString()
  weekStartDate: string;
}
