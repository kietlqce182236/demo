import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { MenuScannerService } from '../services/menu-scanner.service';
import { EvaluateMenuDto } from '../dto/evaluate-menu.dto';

@Controller('rule-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuScannerController {
  constructor(private readonly menuScanner: MenuScannerService) {}

  /**
   * POST /api/v1/rule-engine/evaluate-menu
   * Quét và kiểm tra thực đơn tự động bằng Rule Engine:
   * - Năng lượng & Tỷ lệ P:L:G
   * - Vi chất & Giới hạn muối/đường
   * - Quét xung đột dị ứng với học sinh trong trường
   * - Kiểm tra lặp món
   * - Chấm điểm tuân thủ & Đề xuất món thay thế
   */
  @Post('evaluate-menu')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async evaluateMenu(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: EvaluateMenuDto,
  ) {
    return this.menuScanner.scanMenuCompliance(tenantId, dto);
  }
}
