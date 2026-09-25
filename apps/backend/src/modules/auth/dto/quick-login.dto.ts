import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO cho đăng nhập nhanh theo vai trò (development/testing).
 */
export class QuickLoginDto {
  @ApiProperty({
    example: 'NUTRITIONIST',
    description: 'Role code: PRINCIPAL | NUTRITIONIST | KITCHEN_MANAGER | TEACHER | PARENT',
  })
  @IsString()
  @IsNotEmpty({ message: 'Role code không được để trống' })
  roleCode: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  @IsUUID('all', { message: 'Tenant ID phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Tenant ID không được để trống' })
  tenantId: string;
}
