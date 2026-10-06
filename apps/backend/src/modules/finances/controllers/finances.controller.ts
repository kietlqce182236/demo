import { Controller, Get, Post, Delete, Body, Query, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FinancesService } from '../services/finances.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@ApiTags('School Finances & Reports')
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Lấy báo cáo tài chính trường học mầm non (Thu - Chi, Sổ lớp, Giao dịch, Định mức)' })
  @ApiQuery({ name: 'month', required: false, description: 'Tháng báo cáo (YYYY-MM)' })
  async getFinancialOverview(
    @Query('month') month?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.financesService.getFinancialOverview(resolvedTenantId, month);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Ghi nhận khoản chi tiêu nhà bếp / thực phẩm mới' })
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.financesService.createExpense(dto, resolvedTenantId);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Xóa chứng từ chi tiêu' })
  @ApiParam({ name: 'id', description: 'ID chứng từ chi tiêu' })
  async deleteExpense(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.financesService.deleteExpense(id, resolvedTenantId);
  }

  @Post('remind-class/:id')
  @ApiOperation({ summary: 'Gửi thông báo nhắc đóng tiền ăn cho toàn bộ học sinh còn nợ trong lớp' })
  @ApiParam({ name: 'id', description: 'ID lớp học' })
  async remindClass(
    @Param('id') classId: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.financesService.remindClass(classId, resolvedTenantId);
  }
}
