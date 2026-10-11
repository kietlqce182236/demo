import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondEditRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  responseNote: string;
}
