import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { FinancesService } from '../services/finances.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@ApiTags('Finances & Accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Báo cáo tổng quan tài chính, thu chi và định lượng tiền ăn' })
  @Roles('SCHOOL_MANAGEMENT')
  async getOverview(
    @Query('month') month?: string,
    @CurrentTenant() schoolId?: number,
  ): Promise<any> {
    return this.financesService.getOverview(month, schoolId);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Ghi nhận khoản chi phí nhà bếp / nguyên liệu' })
  @Roles('SCHOOL_MANAGEMENT')
  async createExpense(@Body() dto: CreateExpenseDto): Promise<any> {
    return this.financesService.createExpense(dto);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Xóa khoản chi phí' })
  @Roles('SCHOOL_MANAGEMENT')
  async deleteExpense(@Param('id') id: string) {
    return this.financesService.deleteExpense(id);
  }

  @Post('remind-class/:classId')
  @ApiOperation({ summary: 'Gửi nhắc nhở thu phí đến giáo viên chủ nhiệm & phụ huynh lớp' })
  @Roles('SCHOOL_MANAGEMENT')
  async remindClass(@Param('classId') classId: string) {
    return this.financesService.remindClass(classId);
  }
}
