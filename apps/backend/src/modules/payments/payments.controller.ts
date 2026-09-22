import { Controller, Post, Get, Body, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { VnpayService } from './services/vnpay.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Post('create-url')
  createPaymentUrl(
    @Body() body: { invoiceId: string; amount: number; orderInfo: string },
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const paymentUrl = this.vnpayService.createPaymentUrl({
      invoiceId: body.invoiceId,
      amount: body.amount,
      orderInfo: body.orderInfo,
      ipAddress,
    });
    return { paymentUrl };
  }

  @Get('vnpay-ipn')
  @HttpCode(HttpStatus.OK)
  handleVnpayIpn(@Query() query: Record<string, any>) {
    const isValid = this.vnpayService.verifyIpnSignature({ ...query });
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const responseCode = query['vnp_ResponseCode'];
    if (responseCode === '00') {
      // Giao dịch thành công -> Cập nhật trạng thái Invoice thành PAID
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    return { RspCode: '01', Message: 'Transaction Failed' };
  }
}
