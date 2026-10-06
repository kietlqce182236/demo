import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsIn, Min, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Danh mục chi phí',
    enum: ['FOOD_FRESH', 'MILK_DAIRY', 'COOKING_ENERGY', 'KITCHEN_STAFF', 'EQUIPMENT_MAINTENANCE'],
  })
  @IsNotEmpty()
  @IsIn(['FOOD_FRESH', 'MILK_DAIRY', 'COOKING_ENERGY', 'KITCHEN_STAFF', 'EQUIPMENT_MAINTENANCE'])
  category: string;

  @ApiProperty({ description: 'Nội dung chi tiêu' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Số tiền chi (VNĐ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiPropertyOptional({ description: 'Ngày chi (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  expenseDate?: string;

  @ApiPropertyOptional({ description: 'Tên nhà cung cấp / đối tác' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: 'Số hóa đơn / chứng từ' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Phương thức thanh toán (BANK_TRANSFER / CASH)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  notes?: string;
}
