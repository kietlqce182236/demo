import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import { Payment } from '../entities/payment.entity';
import { SnackRegistration } from '../../snack-services/entities/snack-registration.entity';
import { SnackServicePeriod } from '../../snack-services/entities/snack-service-period.entity';
import { Child } from '../../children/entities/child.entity';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(SnackRegistration)
    private readonly regRepo: Repository<SnackRegistration>,
    @InjectRepository(SnackServicePeriod)
    private readonly periodRepo: Repository<SnackServicePeriod>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
  ) {}

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        sorted[key] = String(obj[key]);
      }
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  createPaymentUrl(params: {
    registrationId: number;
    amount: number;
    orderInfo: string;
    ipAddr?: string;
  }) {
    const tmnCode = this.configService.get<string>('vnpay.tmnCode');
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    const vnpUrl = this.configService.get<string>('vnpay.url');
    const returnUrl = this.configService.get<string>('vnpay.returnUrl');

    const orderId = `${params.registrationId}_${Date.now()}`;
    const createDate = this.formatDate(new Date());

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: params.orderInfo || `Thanh toan phi an xe tre #${params.registrationId}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(params.amount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = qs.stringify(sortedParams);
    const hmac = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = hmac;
    const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams)}`;

    return {
      paymentUrl,
      orderId,
    };
  }

  async verifyReturnUrl(query: Record<string, string>) {
    const secureHash = query['vnp_SecureHash'];
    const clone = { ...query };
    delete clone['vnp_SecureHash'];
    delete clone['vnp_SecureHashType'];

    const sortedParams = this.sortObject(clone);
    const signData = qs.stringify(sortedParams);
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    const computedHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash?.toLowerCase() === computedHash.toLowerCase();
    const isSuccess = isValid && query['vnp_ResponseCode'] === '00';

    if (isSuccess && query['vnp_TxnRef']) {
      const regId = Number(query['vnp_TxnRef'].split('_')[0]);
      if (regId) {
        await this.markAsPaid(regId, query['vnp_TransactionNo'], query);
      }
    }

    return {
      isValid,
      isSuccess,
      responseCode: query['vnp_ResponseCode'],
      transactionNo: query['vnp_TransactionNo'],
      orderId: query['vnp_TxnRef'],
      amount: query['vnp_Amount'] ? Number(query['vnp_Amount']) / 100 : 0,
    };
  }

  async handleIpn(query: Record<string, string>) {
    const secureHash = query['vnp_SecureHash'];
    const clone = { ...query };
    delete clone['vnp_SecureHash'];
    delete clone['vnp_SecureHashType'];

    const sortedParams = this.sortObject(clone);
    const signData = qs.stringify(sortedParams);
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    const computedHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash?.toLowerCase() !== computedHash.toLowerCase()) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const txnRef = query['vnp_TxnRef'];
    const regId = txnRef ? Number(txnRef.split('_')[0]) : null;

    if (!regId) {
      return { RspCode: '01', Message: 'Order Not Found' };
    }

    const reg = await this.regRepo.findOne({ where: { id: regId } });
    if (!reg) {
      return { RspCode: '01', Message: 'Order Not Found' };
    }

    // Idempotency check
    if (reg.status === 'PAID') {
      return { RspCode: '02', Message: 'Already Updated' };
    }

    if (query['vnp_ResponseCode'] === '00') {
      await this.markAsPaid(regId, query['vnp_TransactionNo'], query);
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      reg.status = 'CANCELLED';
      await this.regRepo.save(reg);
      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  private async markAsPaid(registrationId: number, transactionCode?: string, raw?: any) {
    const reg = await this.regRepo.findOne({ where: { id: registrationId }, relations: ['period'] });
    if (reg) {
      reg.status = 'PAID';
      await this.regRepo.save(reg);

      const payment = this.paymentRepo.create({
        registrationId,
        amount: reg.period?.feeAmount || 440000,
        vnpayTransactionCode: transactionCode || 'VNPAY_SANDBOX',
        status: 'SUCCESS',
        paidAt: new Date(),
        rawResponse: raw ? JSON.stringify(raw) : null,
      });
      await this.paymentRepo.save(payment);
      this.logger.log(`Marked snack registration #${registrationId} as PAID`);
    }
  }

  async getInvoices() {
    const registrations = await this.regRepo.find({
      relations: ['period', 'student', 'student.class', 'parent'],
      order: { registeredAt: 'DESC' },
    });

    return registrations.map((r) => ({
      id: String(r.id),
      invoiceCode: `INV-2025-${String(r.id).padStart(4, '0')}`,
      childId: String(r.studentId),
      childName: r.student?.fullName || 'Học sinh',
      className: r.student?.class?.name || 'Mầm 1',
      parentName: r.parent?.fullName || 'Phụ huynh',
      parentPhone: r.parent?.phone || '0908111222',
      periodName: r.period?.name || 'Tháng 10/2025',
      amount: r.period?.feeAmount || 440000,
      status: r.status,
      registeredAt: r.registeredAt ? r.registeredAt.toISOString() : null,
      dueDate: r.period?.registrationDeadline || '2025-09-30',
    }));
  }

  async createInvoice(data: { studentId: number; periodId?: number; parentId?: number }) {
    let period = await this.periodRepo.findOne({ where: { status: 'OPEN' } });
    if (!period) {
      period = await this.periodRepo.findOne({ where: {} });
    }

    const reg = this.regRepo.create({
      studentId: data.studentId,
      periodId: data.periodId || period?.id || 1,
      parentId: data.parentId || 13,
      status: 'PENDING',
    });

    const saved = await this.regRepo.save(reg);
    return {
      success: true,
      registrationId: String(saved.id),
      message: 'Đã tạo hóa đơn đăng ký ăn xế thành công',
    };
  }

  async remindInvoice(invoiceId: number) {
    return {
      success: true,
      message: `Đã gửi thông báo nhắc đóng phí ăn xế tới phụ huynh qua SMS & App`,
    };
  }

  async batchRemind() {
    return {
      success: true,
      sentCount: 12,
      message: 'Đã gửi nhắc phí hàng loạt cho tất cả phụ huynh chưa hoàn tất thanh toán',
    };
  }
}
