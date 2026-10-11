import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickLoginDto {
  @ApiProperty({ example: 'SCHOOL_MANAGER', description: 'Mã vai trò (SCHOOL_MANAGER, NUTRITIONIST, TEACHER, KITCHEN_STAFF, PARENT)' })
  @IsNotEmpty({ message: 'Mã vai trò không được để trống' })
  @IsString()
  roleCode: string;

  @ApiPropertyOptional({ example: '1', description: 'Mã trường (tenantId)' })
  @IsOptional()
  tenantId?: string;
}
