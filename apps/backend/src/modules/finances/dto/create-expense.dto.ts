import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Thịt heo sạch & Rau củ quả HTX Tuần 2' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'FOOD_FRESH' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 4500000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-09-15' })
  @IsNotEmpty()
  @IsString()
  expenseDate: string;

  @ApiPropertyOptional({ example: 'HTX Nông sản sạch Đà Lạt' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'HD-2026-09-0012' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Thực phẩm kiểm dịch đầy đủ' })
  @IsOptional()
  @IsString()
  notes?: string;
}
