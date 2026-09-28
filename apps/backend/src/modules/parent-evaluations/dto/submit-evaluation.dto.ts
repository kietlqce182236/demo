import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class SubmitEvaluationDto {
  @IsOptional()
  @IsString()
  childId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  feedbackDate?: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsString()
  evaluationType?: 'QUICK_EVALUATION' | 'SCHOOL_PROPOSAL';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentRelation?: string;

  @IsOptional()
  @IsString()
  parentNameCustom?: string;

  @IsOptional()
  @IsString()
  childNameCustom?: string;

  @IsOptional()
  @IsString()
  classNameCustom?: string;

  @IsOptional()
  @IsString()
  gradeLevelCustom?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  isDrafting?: boolean;

  @IsOptional()
  attributes?: {
    tastePreference?: string;
    allergySafety?: string;
    portionFit?: string;
  };

  @IsOptional()
  @IsArray()
  photos?: string[];
}
