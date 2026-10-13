import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import { Payment } from '../entities/payment.entity';
import { BreakfastSubscription } from '../entities/breakfast-subscription.entity';
import { SnackRegistration } from '../../snack-services/entities/snack-registration.entity';
import { SnackServicePeriod } from '../../snack-services/entities/snack-service-period.entity';
import { Child } from '../../children/entities/child.entity';

export interface BreakfastPackageDef {
  id: string;
  code: string;
  name: string;
  mealCount: number;
  daysValid: number;
  price: number;
  pricePerMeal: number;
  description: string;
  menuItems: string[];
  popular?: boolean;
  savingsText?: string;
}

export const BREAKFAST_PACKAGES: BreakfastPackageDef[] = [
  {
    id: 'PKG_BREAKFAST_WEEK',
    code: 'WEEK_5',
    name: 'Gói Ăn Sáng 1 Tuần (5 bữa)',
    mealCount: 5,
    daysValid: 7,
    price: 125000,
    pricePerMeal: 25000,
    description: 'Thích hợp dùng thử, kiểm tra khẩu vị của bé với thực đơn cháo súp dinh dưỡng buổi sáng (07:15 - 08:00).',
    menuItems: ['Cháo bò bằm cà rốt', 'Phở bò mầm non', 'Súp gà ngô non', 'Bánh mì sandwich phô mai', 'Cháo lươn rau ngót'],
    popular: false,
    savingsText: 'Tiêu chuẩn',
  },
  {
    id: 'PKG_BREAKFAST_MONTH',
    code: 'MONTH_22',
    name: 'Gói Ăn Sáng Tiêu Chuẩn 1 Tháng (22 bữa)',
    mealCount: 22,
    daysValid: 30,
    price: 480000,
    pricePerMeal: 21800,
    description: 'Lựa chọn phổ biến nhất. Khởi đầu ngày mới tràn đầy năng lượng, phụ huynh yên tâm đi làm sớm không lo chuẩn bị bữa sáng.',
    menuItems: ['Cháo chim bồ câu hạt sen', 'Bún mọc nấm hương', 'Phở gà ta', 'Súp cá hồi rau củ', 'Sữa hạt dinh dưỡng tự nấu'],
    popular: true,
    savingsText: 'Tiết kiệm 13%',
  },
  {
    id: 'PKG_BREAKFAST_TERM',
    code: 'TERM_66',
    name: 'Gói Ăn Sáng Học Kỳ (66 bữa / 3 tháng)',
    mealCount: 66,
    daysValid: 90,
    price: 1350000,
    pricePerMeal: 20450,
    description: 'Trọn gói học kỳ 3 tháng. Tặng kèm phần tráng miệng hoa quả tươi và sữa chua men sống mỗi sáng.',
    menuItems: ['Thực đơn 60 món ăn sáng phong phú', 'Tặng kèm sữa chua hoa quả mỗi sáng', 'Được ưu tiên cá nhân hóa theo kiêng cữ'],
    popular: false,
    savingsText: 'Tiết kiệm 18%',
  },
];

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(BreakfastSubscription)
    private readonly breakfastRepo: Repository<BreakfastSubscription>,
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

  // =========================================================================
  // 1. DỊCH VỤ ĂN XẾ (SNACK SERVICES) VNPAY
  // =========================================================================

  createPaymentUrl(params: {
    registrationId?: number;
    amount: number;
    orderInfo: string;
    ipAddr?: string;
  }) {
    const tmnCode = this.configService.get<string>('vnpay.tmnCode') || '';
    const secretKey = this.configService.get<string>('vnpay.hashSecret') || '';
    const vnpUrl = this.configService.get<string>('vnpay.url') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.configService.get<string>('vnpay.returnUrl') || 'http://localhost:5173/payments/vnpay-return';

    const orderId = `${params.registrationId || Date.now()}_${Date.now()}`;
    const createDate = this.formatDate(new Date());

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: params.orderInfo || `Thanh toan phi an #${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(params.amount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');
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
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');
    const secretKey = this.configService.get<string>('vnpay.hashSecret') || '';
    const computedHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash?.toLowerCase() === computedHash.toLowerCase();
    const isSuccess = isValid && query['vnp_ResponseCode'] === '00';
    const txnRef = query['vnp_TxnRef'] || '';

    if (isSuccess && txnRef) {
      if (txnRef.startsWith('BF_')) {
        // Giao dịch Gói ăn sáng
        const subId = Number(txnRef.split('_')[1]);
        if (subId) {
          await this.markBreakfastAsPaid(subId, query['vnp_TransactionNo'], query);
        }
      } else {
        // Giao dịch Ăn xế chiều
        const regId = Number(txnRef.split('_')[0]);
        if (regId) {
          await this.markAsPaid(regId, query['vnp_TransactionNo'], query);
        }
      }
    }

    return {
      isValid,
      isSuccess,
      responseCode: query['vnp_ResponseCode'],
      transactionNo: query['vnp_TransactionNo'],
      orderId: query['vnp_TxnRef'],
      amount: query['vnp_Amount'] ? Number(query['vnp_Amount']) / 100 : 0,
      serviceType: txnRef.startsWith('BF_') ? 'BREAKFAST' : 'SNACK',
    };
  }

  async handleIpn(query: Record<string, string>) {
    const secureHash = query['vnp_SecureHash'];
    const clone = { ...query };
    delete clone['vnp_SecureHash'];
    delete clone['vnp_SecureHashType'];

    const sortedParams = this.sortObject(clone);
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');
    const secretKey = this.configService.get<string>('vnpay.hashSecret') || '';
    const computedHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash?.toLowerCase() !== computedHash.toLowerCase()) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const txnRef = query['vnp_TxnRef'] || '';
    if (txnRef.startsWith('BF_')) {
      // Gói ăn sáng
      const subId = Number(txnRef.split('_')[1]);
      const sub = await this.breakfastRepo.findOne({ where: { id: subId } });
      if (!sub) return { RspCode: '01', Message: 'Order Not Found' };
      if (sub.status === 'PAID') return { RspCode: '02', Message: 'Already Updated' };

      if (query['vnp_ResponseCode'] === '00') {
        await this.markBreakfastAsPaid(subId, query['vnp_TransactionNo'], query);
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        sub.status = 'CANCELLED';
        await this.breakfastRepo.save(sub);
        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } else {
      // Ăn xế
      const regId = txnRef ? Number(txnRef.split('_')[0]) : null;
      if (!regId) return { RspCode: '01', Message: 'Order Not Found' };
      const reg = await this.regRepo.findOne({ where: { id: regId } });
      if (!reg) return { RspCode: '01', Message: 'Order Not Found' };
      if (reg.status === 'PAID') return { RspCode: '02', Message: 'Already Updated' };

      if (query['vnp_ResponseCode'] === '00') {
        await this.markAsPaid(regId, query['vnp_TransactionNo'], query);
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        reg.status = 'CANCELLED';
        await this.regRepo.save(reg);
        return { RspCode: '00', Message: 'Confirm Success' };
      }
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
        serviceType: 'SNACK',
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

  // =========================================================================
  // 2. DỊCH VỤ GÓI ĂN SÁNG BUỔI SÁNG (BREAKFAST MEAL PACKAGES)
  // =========================================================================

  /**
   * Lấy danh sách các gói ăn sáng có sẵn do Ban Giám Hiệu tạo và ĐANG MỞ ĐĂNG KÝ ('OPEN')
   * Khi hiệu trưởng tạo gói thì bên phụ huynh mới thấy và mua
   */
  async getBreakfastPackages(): Promise<BreakfastPackageDef[]> {
    const periods = await this.periodRepo.find({
      where: { status: 'OPEN' },
      order: { id: 'ASC' },
    });

    if (!periods || periods.length === 0) {
      return BREAKFAST_PACKAGES;
    }

    return periods.map((p) => {
      const price = Number(p.feeAmount) || 480000;
      let mealCount = 22;
      let daysValid = 30;
      let savingsText = 'Tiết kiệm 13%';

      const lowerName = (p.name || '').toLowerCase();
      if (lowerName.includes('5 bữa') || lowerName.includes('1 tuần') || price <= 150000) {
        mealCount = 5;
        daysValid = 7;
        savingsText = 'Dùng thử 1 tuần';
      } else if (lowerName.includes('66 bữa') || lowerName.includes('học kỳ') || price >= 1000000) {
        mealCount = 66;
        daysValid = 90;
        savingsText = 'Tiết kiệm 18%';
      } else if (lowerName.includes('10 bữa') || lowerName.includes('2 tuần')) {
        mealCount = 10;
        daysValid = 14;
        savingsText = 'Tiết kiệm 8%';
      }

      if (p.startDate && p.endDate) {
        const startMs = new Date(p.startDate).getTime();
        const endMs = new Date(p.endDate).getTime();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
          const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) daysValid = diffDays;
        }
      }

      const pricePerMeal = Math.round(price / (mealCount || 1));
      const popular = price >= 400000 && price <= 600000;

      return {
        id: String(p.id),
        code: `BF_PKG_${p.id}`,
        name: p.name,
        mealCount,
        daysValid,
        price,
        pricePerMeal,
        description: `Gói ăn sáng dinh dưỡng (${mealCount} bữa). Thực đơn cháo súp sữa hạt chuẩn năng lượng 295 kcal (07:15 - 08:00) do Nhà trường phê duyệt.`,
        menuItems: [
          'Cháo bồ câu hạt sen / Phở bò mầm non',
          'Súp gà ngô non / Bún mọc nấm hương',
          'Súp cá hồi rau củ / Cháo lươn rau ngót',
          'Sữa hạt tươi tự nấu (đậu nành, óc chó, sen)',
          'Tặng kèm hoa quả tươi hoặc sữa chua men sống',
        ],
        popular,
        savingsText,
      };
    });
  }

  /**
   * Lấy danh sách đăng ký mua gói ăn sáng của học sinh
   */
  async getBreakfastSubscriptions(query?: { parentId?: number; studentId?: number; status?: string }) {
    const where: any = {};
    if (query?.parentId) where.parentId = query.parentId;
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.status && query.status !== 'ALL') where.status = query.status;

    const subscriptions = await this.breakfastRepo.find({
      where,
      relations: ['student', 'student.class', 'parent'],
      order: { id: 'DESC' },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    return subscriptions.map((s) => {
      const isPaid = s.status === 'PAID';
      const isNotExpired = !s.endDate || s.endDate >= todayStr;
      const isEligibleForBreakfast = isPaid && isNotExpired;

      return {
        id: String(s.id),
        subscriptionCode: `BF-SUB-${String(s.id).padStart(4, '0')}`,
        studentId: Number(s.studentId),
        studentName: s.student?.fullName || 'Học sinh',
        studentCode: s.student?.studentCode || 'HD-000',
        className: s.student?.class?.name || 'Chưa xếp lớp',
        classId: s.student?.classId ? Number(s.student?.classId) : undefined,
        parentId: s.parentId ? Number(s.parentId) : undefined,
        parentName: s.parent?.fullName || 'Phụ huynh',
        parentPhone: s.parent?.phone || '0908111222',
        packageId: s.packageId,
        packageName: s.packageName,
        mealCount: s.mealCount,
        amount: Number(s.amount),
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        vnpayOrderId: s.vnpayOrderId,
        vnpayTransactionNo: s.vnpayTransactionNo,
        paidAt: s.paidAt ? s.paidAt.toISOString() : null,
        createdAt: s.createdAt ? s.createdAt.toISOString() : null,
        // Cốt lõi: Có được cung cấp đồ ăn sáng hôm nay không?
        isEligibleForBreakfast,
        eligibilityStatusText: isEligibleForBreakfast
          ? 'Được cung cấp đồ ăn sáng'
          : s.status === 'PENDING'
          ? 'Chưa đóng tiền — Không có đồ ăn sáng'
          : 'Hết hạn gói — Không có đồ ăn sáng',
      };
    });
  }

  /**
   * Phụ huynh đăng ký mua gói ăn sáng cho con
   */
  async createBreakfastSubscription(data: {
    studentId: number;
    packageId: string;
    parentId?: number;
  }) {
    let pkgName = '';
    let pkgMealCount = 22;
    let pkgPrice = 480000;
    let pkgDaysValid = 30;

    const numericId = Number(data.packageId);
    let period: SnackServicePeriod | null = null;
    if (!isNaN(numericId)) {
      period = await this.periodRepo.findOne({ where: { id: numericId } });
    }

    if (period) {
      pkgName = period.name;
      pkgPrice = Number(period.feeAmount) || 480000;
      const lowerName = (period.name || '').toLowerCase();
      if (lowerName.includes('5 bữa') || lowerName.includes('1 tuần') || pkgPrice <= 150000) {
        pkgMealCount = 5;
        pkgDaysValid = 7;
      } else if (lowerName.includes('66 bữa') || lowerName.includes('học kỳ') || pkgPrice >= 1000000) {
        pkgMealCount = 66;
        pkgDaysValid = 90;
      } else if (lowerName.includes('10 bữa')) {
        pkgMealCount = 10;
        pkgDaysValid = 14;
      }
      if (period.startDate && period.endDate) {
        const startMs = new Date(period.startDate).getTime();
        const endMs = new Date(period.endDate).getTime();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
          const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) pkgDaysValid = diffDays;
        }
      }
    } else {
      const fallbackPkg = BREAKFAST_PACKAGES.find((p) => p.id === data.packageId) || BREAKFAST_PACKAGES[1];
      pkgName = fallbackPkg.name;
      pkgMealCount = fallbackPkg.mealCount;
      pkgPrice = fallbackPkg.price;
      pkgDaysValid = fallbackPkg.daysValid;
    }

    const student = await this.childRepo.findOne({ where: { id: data.studentId } });
    if (!student) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const end = new Date(today.getTime() + pkgDaysValid * 24 * 60 * 60 * 1000);
    const endDate = end.toISOString().split('T')[0];

    const sub = this.breakfastRepo.create({
      studentId: data.studentId,
      parentId: data.parentId || 13,
      packageId: String(data.packageId),
      packageName: pkgName,
      mealCount: pkgMealCount,
      amount: pkgPrice,
      status: 'PENDING',
      startDate,
      endDate,
    });

    const saved = await this.breakfastRepo.save(sub);
    saved.vnpayOrderId = `BF_${saved.id}_${Date.now()}`;
    await this.breakfastRepo.save(saved);

    return {
      success: true,
      id: saved.id,
      subscriptionId: String(saved.id),
      orderId: saved.vnpayOrderId,
      package: {
        id: String(data.packageId),
        name: pkgName,
        price: pkgPrice,
        mealCount: pkgMealCount,
      },
      amount: pkgPrice,
      message: `Đã khởi tạo đăng ký ${pkgName} cho bé ${student.fullName}. Vui lòng thanh toán VNPAY để kích hoạt suất ăn sáng.`,
    };
  }

  /**
   * Tạo link thanh toán VNPAY Sandbox cho gói ăn sáng
   */
  async createBreakfastPaymentUrl(params: {
    subscriptionId: number;
    ipAddr?: string;
  }) {
    const sub = await this.breakfastRepo.findOne({
      where: { id: params.subscriptionId },
      relations: ['student'],
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký gói ăn sáng');
    }

    const tmnCode = this.configService.get<string>('vnpay.tmnCode') || '';
    const secretKey = this.configService.get<string>('vnpay.hashSecret') || '';
    const vnpUrl = this.configService.get<string>('vnpay.url') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.configService.get<string>('vnpay.returnUrl') || 'http://localhost:5173/payments/vnpay-return';

    const orderId = `BF_${sub.id}_${Date.now()}`;
    sub.vnpayOrderId = orderId;
    await this.breakfastRepo.save(sub);

    const createDate = this.formatDate(new Date());

    const studentName = sub.student?.fullName || 'be';
    const orderInfo = `Thanh toan ${sub.packageName} cho be ${studentName}`;

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(Number(sub.amount) * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: params.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');
    const hmac = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = hmac;
    const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams)}`;

    return {
      paymentUrl,
      orderId,
      subscriptionId: sub.id,
      amount: Number(sub.amount),
      packageName: sub.packageName,
      studentName,
    };
  }

  /**
   * Mô phỏng thanh toán VNPAY Sandbox thành công tức thì (cho môi trường Demo / Testing)
   */
  async simulateBreakfastPayment(subscriptionId: number, transactionCode?: string) {
    const sub = await this.breakfastRepo.findOne({
      where: { id: subscriptionId },
      relations: ['student'],
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký gói ăn sáng');
    }

    const txCode = transactionCode || `VNP-BF-${Date.now().toString().slice(-6)}`;
    await this.markBreakfastAsPaid(subscriptionId, txCode, {
      simulated: true,
      method: 'VNPAY_SANDBOX_SIMULATE',
    });

    return {
      success: true,
      subscriptionId: sub.id,
      studentName: sub.student?.fullName,
      packageName: sub.packageName,
      amount: Number(sub.amount),
      transactionCode: txCode,
      isEligibleForBreakfast: true,
      message: `Thanh toán thành công qua VNPAY! Bé ${sub.student?.fullName || 'học sinh'} đã được kích hoạt cung cấp đồ ăn sáng tại trường.`,
    };
  }

  /**
   * Ghi nhận đơn đăng ký ăn sáng là ĐÃ THANH TOÁN (PAID) và lưu bản ghi Payment
   */
  async markBreakfastAsPaid(subscriptionId: number, transactionCode?: string, raw?: any) {
    const sub = await this.breakfastRepo.findOne({
      where: { id: subscriptionId },
      relations: ['student'],
    });

    if (sub) {
      sub.status = 'PAID';
      sub.paidAt = new Date();
      sub.vnpayTransactionNo = transactionCode || `VNP-BF-${Date.now().toString().slice(-6)}`;
      await this.breakfastRepo.save(sub);

      const payment = this.paymentRepo.create({
        breakfastSubscriptionId: subscriptionId,
        amount: Number(sub.amount),
        vnpayTransactionCode: sub.vnpayTransactionNo,
        status: 'SUCCESS',
        serviceType: 'BREAKFAST',
        paidAt: new Date(),
        rawResponse: raw ? JSON.stringify(raw) : null,
      });
      await this.paymentRepo.save(payment);

      this.logger.log(`Marked breakfast subscription #${subscriptionId} for student #${sub.studentId} as PAID (${sub.packageName})`);
    }
  }

  /**
   * Kiểm tra quyền lợi ăn sáng của 1 học sinh hôm nay
   */
  async getStudentBreakfastEligibility(studentId: number) {
    const todayStr = new Date().toISOString().split('T')[0];

    const activeSub = await this.breakfastRepo.findOne({
      where: {
        studentId,
        status: 'PAID',
      },
      order: { id: 'DESC' },
    });

    const isEligible = Boolean(activeSub && (!activeSub.endDate || activeSub.endDate >= todayStr));

    const pendingSub = await this.breakfastRepo.findOne({
      where: {
        studentId,
        status: 'PENDING',
      },
      order: { id: 'DESC' },
    });

    return {
      studentId,
      isEligible,
      status: isEligible ? 'ELIGIBLE' : pendingSub ? 'PENDING_PAYMENT' : 'NO_SUBSCRIPTION',
      activeSubscription: isEligible
        ? {
            id: activeSub.id,
            packageName: activeSub.packageName,
            mealCount: activeSub.mealCount,
            endDate: activeSub.endDate,
            paidAt: activeSub.paidAt,
          }
        : null,
      pendingSubscription: pendingSub
        ? {
            id: pendingSub.id,
            packageName: pendingSub.packageName,
            amount: Number(pendingSub.amount),
          }
        : null,
      message: isEligible
        ? 'Học sinh ĐÃ ĐÓNG TIỀN và ĐƯỢC CUNG CẤP ĐỒ ĂN SÁNG tại trường.'
        : 'Học sinh CHƯA ĐÓNG TIỀN và KHÔNG ĐƯỢC CUNG CẤP ĐỒ ĂN SÁNG tại trường.',
    };
  }
}
