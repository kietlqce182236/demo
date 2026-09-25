import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UploadLogoDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên file không được để trống' })
  fileName: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Dung lượng file không được để trống' })
  fileSizeBytes: number; // dung lượng byte

  @IsString()
  @IsNotEmpty({ message: 'Định dạng MIME không được để trống' })
  mimeType: string;

  @IsString()
  @IsOptional()
  fileContentBase64?: string;
}
