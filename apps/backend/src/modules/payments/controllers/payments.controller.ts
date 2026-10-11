import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { VnpayService } from '../services/vnpay.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Payments & VNPAY Billing')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly vnpayService: VnpayService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('invoices')
  @ApiOperation({ summary: 'Lấy danh sách các hóa đơn tiền ăn xế 17h' })
  async getInvoices() {
    return this.vnpayService.getInvoices();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('invoices')
  @ApiOperation({ summary: 'Tạo mới phiếu đăng ký / hóa đơn ăn xế' })
  async createInvoice(@Body() body: any) {
    return this.vnpayService.createInvoice(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create-url')
  @ApiOperation({ summary: 'Khởi tạo link thanh toán VNPAY Sandbox có chữ ký HMAC-SHA512' })
  async createPaymentUrl(
    @Body() body: { registrationId: number; amount: number; orderInfo: string },
    @Req() req: Request,
  ) {
    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    return this.vnpayService.createPaymentUrl({
      ...body,
      ipAddr,
    });
  }

  @Public()
  @Get('vnpay-return')
  @ApiOperation({ summary: 'Xác thực kết quả thanh toán khi khách hàng quay lại từ VNPAY' })
  async vnpayReturn(@Query() query: Record<string, string>) {
    return this.vnpayService.verifyReturnUrl(query);
  }

  @Public()
  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'Webhook IPN từ máy chủ VNPAY (Server-to-Server, Idempotent)' })
  async vnpayIpn(@Query() query: Record<string, string>) {
    return this.vnpayService.handleIpn(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('invoices/:id/remind')
  @ApiOperation({ summary: 'Gửi tin nhắc đóng phí ăn xế cho 1 phụ huynh' })
  async remindInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.vnpayService.remindInvoice(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('invoices/batch-remind')
  @ApiOperation({ summary: 'Gửi nhắc phí hàng loạt cho các phụ huynh chưa thanh toán' })
  async batchRemind() {
    return this.vnpayService.batchRemind();
  }
}
