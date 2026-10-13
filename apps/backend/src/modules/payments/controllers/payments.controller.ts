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

  // --------------------------------------------------------------------------
  // ĂN XẾ (SNACK INVOICES)
  // --------------------------------------------------------------------------
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
    @Body() body: { registrationId?: number; amount: number; orderInfo: string },
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

  // --------------------------------------------------------------------------
  // GÓI ĂN SÁNG BUỔI SÁNG (BREAKFAST MEAL PACKAGES & VNPAY)
  // --------------------------------------------------------------------------
  @Public()
  @Get('breakfast/packages')
  @ApiOperation({ summary: 'Lấy danh mục các gói ăn sáng có sẵn (Tuần, Tháng, Học kỳ)' })
  async getBreakfastPackages() {
    return this.vnpayService.getBreakfastPackages();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('breakfast/subscriptions')
  @ApiOperation({ summary: 'Lấy danh sách các đăng ký gói ăn sáng của học sinh' })
  async getBreakfastSubscriptions(
    @Query('parentId') parentId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.vnpayService.getBreakfastSubscriptions({
      parentId: parentId ? Number(parentId) : undefined,
      studentId: studentId ? Number(studentId) : undefined,
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('breakfast/subscribe')
  @ApiOperation({ summary: 'Phụ huynh chọn mua gói ăn sáng cho học sinh' })
  async createBreakfastSubscription(
    @Body() body: { studentId: number; packageId: string; parentId?: number },
  ) {
    return this.vnpayService.createBreakfastSubscription(body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('breakfast/create-url')
  @ApiOperation({ summary: 'Khởi tạo URL thanh toán VNPAY Sandbox cho gói ăn sáng' })
  async createBreakfastPaymentUrl(
    @Body() body: { subscriptionId: number },
    @Req() req: Request,
  ) {
    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    return this.vnpayService.createBreakfastPaymentUrl({
      subscriptionId: Number(body.subscriptionId),
      ipAddr,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('breakfast/simulate-pay')
  @ApiOperation({ summary: 'Mô phỏng thanh toán VNPAY Sandbox thành công tức thì cho gói ăn sáng' })
  async simulateBreakfastPayment(
    @Body() body: { subscriptionId: number; transactionCode?: string },
  ) {
    return this.vnpayService.simulateBreakfastPayment(
      Number(body.subscriptionId),
      body.transactionCode,
    );
  }

  @Public()
  @Get('breakfast/status/:studentId')
  @ApiOperation({ summary: 'Kiểm tra quyền lợi ăn sáng hôm nay của 1 học sinh' })
  async getStudentBreakfastEligibility(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.vnpayService.getStudentBreakfastEligibility(studentId);
  }
}
