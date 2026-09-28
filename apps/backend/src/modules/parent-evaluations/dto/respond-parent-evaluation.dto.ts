import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class RespondParentEvaluationDto {
  @IsNotEmpty()
  @IsString()
  responseContent: string;

  @IsOptional()
  @IsBoolean()
  pushNotification?: boolean = true;

  @IsOptional()
  @IsString()
  respondedByName?: string = 'Hiệu trưởng Nguyễn Thu Thủy';

  @IsOptional()
  @IsString()
  status?: string = 'RESPONDED';

  @IsOptional()
  @IsBoolean()
  isDrafting?: boolean = false;
}
