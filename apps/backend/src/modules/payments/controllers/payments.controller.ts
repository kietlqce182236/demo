import { Controller, Post, Get, Body, Query, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { VnpayService, CreateInvoiceDto } from '../services/vnpay.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly vnpayService: VnpayService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  private resolveUserId(req: Request): string {
    return (req as any).user?.id || '10000000-0000-0000-0000-000000000008';
  }

  @Get('invoices')
  async getInvoices(@Req() req: Request) {
    return this.vnpayService.getInvoices(this.resolveTenantId(req));
  }

  @Post('invoices')
  async createInvoice(@Req() req: Request, @Body() dto: CreateInvoiceDto) {
    return this.vnpayService.createInvoice(
      this.resolveTenantId(req),
      this.resolveUserId(req),
      dto,
    );
  }

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
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    const isValid = this.vnpayService.verifyIpnSignature({ ...query });
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    return this.vnpayService.confirmIpnPayment(query);
  }
}
