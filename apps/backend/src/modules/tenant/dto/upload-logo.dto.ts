import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadLogoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsNumber()
  fileSizeBytes: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileContentBase64?: string;
}
