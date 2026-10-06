import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

export interface CreatePaymentUrlOptions {
  invoiceId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
}

export interface CreateInvoiceDto {
  childId?: string;
  childName: string;
  className?: string;
  packageName: string;
  amount: number;
}

@Injectable()
export class VnpayService {
  private tmnCode: string;
  private hashSecret: string;
  private vnpUrl: string;
  private returnUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.tmnCode = this.configService.get<string>('vnpay.tmnCode') || 'KIDSJOURNAL';
    this.hashSecret = this.configService.get<string>('vnpay.hashSecret') || 'RAQNSVKA9YW50SGSVG47O40BTR3MLU2Q';
    this.vnpUrl = this.configService.get<string>('vnpay.url') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = this.configService.get<string>('vnpay.returnUrl') || 'http://localhost:5173/payments';
  }

  createPaymentUrl(options: CreatePaymentUrlOptions): string {
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const txnRef = options.invoiceId;

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
    const queryCopy = { ...query };
    delete queryCopy['vnp_SecureHash'];
    delete queryCopy['vnp_SecureHashType'];

    const sortedKeys = Object.keys(queryCopy).sort();
    const signDataParts: string[] = [];

    for (const key of sortedKeys) {
      const value = queryCopy[key];
      if (value !== null && value !== undefined && value.toString().length > 0) {
        signDataParts.push(`${key}=${encodeURIComponent(value.toString())}`);
      }
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === calculatedHash;
  }

  /**
   * Lấy danh sách hóa đơn và giao dịch ăn xế trực tiếp từ cơ sở dữ liệu
   */
  async getInvoices(tenantId: string) {
    const rows = await this.dataSource.query(
      `SELECT t.id, t.order_code as "orderCode", t.amount, t.status, 
              t.vnp_transaction_no as "vnpTransactionNo",
              to_char(t.paid_at, 'YYYY-MM-DD HH24:MI') as "paidAt",
              coalesce(c.full_name, 'Học sinh mầm non') as "childName",
              coalesce(cl.name, 'Lớp mầm') as "className",
              coalesce(ss.name, 'Gói Năng Lượng Chiều 17h') as "packageName",
              concat('Tháng ', to_char(coalesce(sr.start_date, t.created_at), 'MM/YYYY'), ' (22 ngày)') as "periodText"
       FROM transactions t
       LEFT JOIN snack_registrations sr ON t.registration_id = sr.id
       LEFT JOIN children c ON sr.child_id = c.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       LEFT JOIN snack_services ss ON sr.snack_service_id = ss.id
       WHERE t.tenant_id = $1
       ORDER BY t.created_at DESC`,
      [tenantId],
    );

    return rows;
  }

  /**
   * Khởi tạo đăng ký suất ăn xế và hóa đơn mới trong database
   */
  async createInvoice(tenantId: string, userId: string, dto: CreateInvoiceDto) {
    // 1. Tìm hoặc lấy học sinh mặc định
    let childId = dto.childId;
    if (!childId) {
      const children = await this.dataSource.query(
        `SELECT id FROM children WHERE tenant_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [tenantId],
      );
      childId = children[0]?.id || '11000000-0000-0000-0000-000000000001';
    }

    // 2. Tìm gói ăn xế phù hợp
    const services = await this.dataSource.query(
      `SELECT id FROM snack_services WHERE tenant_id = $1 AND is_active = TRUE LIMIT 1`,
      [tenantId],
    );
    const snackServiceId = services[0]?.id || '18000000-0000-0000-0000-000000000001';

    // 3. Tạo đơn đăng ký snack_registrations
    const regResult = await this.dataSource.query(
      `INSERT INTO snack_registrations (
        tenant_id, child_id, snack_service_id, registered_by,
        start_date, end_date, quantity_per_day, total_price, status
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 1, $5, 'PENDING')
      RETURNING id`,
      [tenantId, childId, snackServiceId, userId, dto.amount],
    );
    const regId = regResult[0]?.id;

    // 4. Tạo giao dịch transactions
    const orderCode = `SNACK-${Date.now().toString().slice(-6)}`;
    const txResult = await this.dataSource.query(
      `INSERT INTO transactions (
        tenant_id, registration_id, payer_id, order_code,
        amount, currency, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, 'VND', 'VNPAY', 'PENDING')
      RETURNING id, order_code as "orderCode", amount, status`,
      [tenantId, regId, userId, orderCode, dto.amount],
    );

    return {
      id: txResult[0].id,
      orderCode: txResult[0].orderCode,
      childName: dto.childName,
      className: dto.className || 'Lớp Mầm 1',
      packageName: dto.packageName,
      amount: dto.amount,
      periodText: 'Tháng hiện tại (22 ngày)',
      status: 'PENDING',
    };
  }

  /**
   * Xử lý xác nhận IPN Idempotent từ cổng VNPAY
   */
  async confirmIpnPayment(query: Record<string, any>) {
    const txnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];
    const transactionNo = query['vnp_TransactionNo'];
    const bankCode = query['vnp_BankCode'];

    // 1. Tìm giao dịch theo id hoặc order_code
    const txRows = await this.dataSource.query(
      `SELECT id, registration_id, status FROM transactions WHERE id::text = $1 OR order_code = $1`,
      [txnRef],
    );

    if (txRows.length === 0) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const tx = txRows[0];

    // Idempotency: Nếu đã thành công trước đó thì không xử lý lại
    if (tx.status === 'SUCCESS') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (responseCode === '00') {
      // 2. Cập nhật transaction thành SUCCESS
      await this.dataSource.query(
        `UPDATE transactions 
         SET status = 'SUCCESS', vnp_transaction_no = $1, vnp_bank_code = $2, 
             vnp_response_code = $3, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
             raw_callback_payload = $4
         WHERE id = $5`,
        [transactionNo, bankCode, responseCode, JSON.stringify(query), tx.id],
      );

      // 3. Kích hoạt đơn đăng ký snack_registrations thành ACTIVE
      if (tx.registration_id) {
        await this.dataSource.query(
          `UPDATE snack_registrations SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [tx.registration_id],
        );
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      await this.dataSource.query(
        `UPDATE transactions SET status = 'FAILED', vnp_response_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [responseCode, tx.id],
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  /**
   * Gửi nhắc nhở đóng phí ăn xế cho 1 hóa đơn
   */
  async remindPayment(invoiceId: string) {
    const tx = await this.dataSource.query(
      `SELECT t.id, t.order_code, t.status, c.full_name as "childName"
       FROM transactions t
       LEFT JOIN snack_registrations sr ON t.registration_id = sr.id
       LEFT JOIN children c ON sr.child_id = c.id
       WHERE t.id::text = $1 OR t.order_code = $1`,
      [invoiceId],
    );

    if (tx.length === 0) {
      throw new NotFoundException('Không tìm thấy hóa đơn cần nhắc nhở.');
    }

    const order = tx[0];
    const childName = order.childName || 'học sinh';

    return {
      success: true,
      message: `Đã gửi thông báo nhắc nhở đóng phí ăn xế (Mã: ${order.order_code}) tới phụ huynh của bé ${childName}.`,
    };
  }

  /**
   * Gửi nhắc nhở hàng loạt cho tất cả phụ huynh có hóa đơn PENDING
   */
  async batchRemindPending(tenantId: string) {
    const pendingList = await this.dataSource.query(
      `SELECT t.id, t.order_code
       FROM transactions t
       WHERE t.tenant_id = $1 AND t.status = 'PENDING'`,
      [tenantId],
    );

    return {
      success: true,
      count: pendingList.length,
      message: `Đã gửi thông báo nhắc nhở thành công tới ${pendingList.length} phụ huynh có hóa đơn chưa thanh toán.`,
    };
  }
}
