import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeclareAllergyDto {
  @ApiProperty({ example: 1, description: 'ID dị ứng trong bảng allergens' })
  @IsNotEmpty({ message: 'Allergen ID không được để trống' })
  @IsNumber()
  allergenId: number;

  @ApiProperty({ example: 'HIGH', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsNotEmpty({ message: 'Mức độ nghiêm trọng không được để trống' })
  @IsString()
  severity: string;

  @ApiPropertyOptional({ example: 'Phản ứng sưng môi, phát ban sau 15 phút' })
  @IsOptional()
  @IsString()
  note?: string;
}
