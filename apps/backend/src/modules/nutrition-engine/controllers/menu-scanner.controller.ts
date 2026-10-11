import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuScannerService } from '../services/menu-scanner.service';
import { EvaluateMenuDto } from '../dto/evaluate-menu.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Nutrition Rule Engine Scanner')
@Controller('rule-engine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MenuScannerController {
  constructor(private readonly scannerService: MenuScannerService) {}

  @Post('evaluate-menu')
  @ApiOperation({ summary: 'Thẩm định thực đơn theo Thông tư 28/2016/TT-BGDĐT & cân bằng P:L:G' })
  async evaluateMenu(@Body() dto: EvaluateMenuDto) {
    return this.scannerService.evaluateMenu(dto);
  }
}
