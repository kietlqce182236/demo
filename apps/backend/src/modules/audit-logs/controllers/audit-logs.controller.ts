import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuditLogsService } from '../services/audit-logs.service';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';

@ApiTags('Audit Logs & System Traceability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Truy vấn danh sách nhật ký kiểm toán hệ thống' })
  @Roles('SCHOOL_MANAGEMENT')
  async getAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.getAuditLogs(query);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Lấy các tùy chọn bộ lọc nhật ký' })
  @Roles('SCHOOL_MANAGEMENT')
  async getFilterOptions() {
    return this.auditLogsService.getFilterOptions();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng số lượng nhật ký kiểm toán' })
  @Roles('SCHOOL_MANAGEMENT')
  async getStats() {
    return this.auditLogsService.getStats();
  }
}
