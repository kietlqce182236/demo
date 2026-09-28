import { IsString, IsOptional } from 'class-validator';

export class ApproveMenuDto {
  @IsString()
  @IsOptional()
  approvalNotes?: string;
}
