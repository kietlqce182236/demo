import { IsString, IsNotEmpty } from 'class-validator';

export class RejectMenuDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
