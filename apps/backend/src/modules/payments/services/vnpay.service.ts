import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CreatePaymentUrlOptions {
  invoiceId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
}

@Injectable()
export class VnpayService {
  private tmnCode: string;
  private hashSecret: string;
  private vnpUrl: string;
  private returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('vnpay.tmnCode');
    this.hashSecret = this.configService.get<string>('vnpay.hashSecret');
    this.vnpUrl = this.configService.get<string>('vnpay.url');
    this.returnUrl = this.configService.get<string>('vnpay.returnUrl');
  }

  createPaymentUrl(options: CreatePaymentUrlOptions): string {
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const txnRef = `${options.invoiceId}_${Date.now()}`;

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: options.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (options.amount * 100).toString(), // VNPAY tính theo đơn vị VND x 100
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: options.ipAddress || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // Sắp xếp các tham số theo thứ tự alphabet (bắt buộc theo chuẩn VNPAY)
    const sortedKeys = Object.keys(vnpParams).sort();
    const signDataParts: string[] = [];
    const urlParts: string[] = [];

    for (const key of sortedKeys) {
      const value = vnpParams[key];
      if (value !== null && value !== undefined && value.length > 0) {
        signDataParts.push(`${key}=${encodeURIComponent(value)}`);
        urlParts.push(`${key}=${encodeURIComponent(value)}`);
      }
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return `${this.vnpUrl}?${urlParts.join('&')}&vnp_SecureHash=${secureHash}`;
  }

  verifyIpnSignature(query: Record<string, any>): boolean {
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedKeys = Object.keys(query).sort();
    const signDataParts: string[] = [];

    for (const key of sortedKeys) {
      const value = query[key];
      if (value !== null && value !== undefined && value.toString().length > 0) {
        signDataParts.push(`${key}=${encodeURIComponent(value.toString())}`);
      }
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === calculatedHash;
  }
}
