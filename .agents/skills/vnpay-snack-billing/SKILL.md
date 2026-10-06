---
name: vnpay-snack-billing
description: >
  VNPAY Snack Billing skill for KidMeal — afternoon snack service (dịch vụ ăn xế 17h)
  payment integration with VNPAY Sandbox, URL signing with HMAC-SHA512,
  IPN webhook handling, idempotent payment processing, and billing lifecycle.
---

# 💳 VNPAY Snack Billing — KidMeal

## 1. Feature Overview
Parents register their children for the **Afternoon Snack Service (Dịch vụ ăn xế 17h)**
and pay monthly via **VNPAY** online payment gateway.

### Billing Lifecycle
```
1. PARENT registers child for snack service → Status: REGISTERED
2. SCHOOL_MANAGEMENT sets monthly fee → Status: PENDING_PAYMENT
3. System generates VNPAY payment URL → Parent redirected to VNPAY
4. Parent completes payment → VNPAY sends IPN callback
5. System verifies & records payment → Status: PAID
6. Kitchen receives updated snack headcount
```

---

## 2. VNPAY Integration (Sandbox)

### 2.1 Environment Variables
```env
# .env (root)
VNPAY_TMN_CODE=YOUR_TMN_CODE          # Terminal code from VNPAY Sandbox
VNPAY_HASH_SECRET=YOUR_HASH_SECRET     # HMAC-SHA512 secret key
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payments/vnpay-return
VNPAY_IPN_URL=http://your-server/api/v1/payments/vnpay-ipn
```

### 2.2 Payment URL Generation

**CRITICAL: Parameters MUST be sorted alphabetically before HMAC-SHA512 signing.**

```typescript
// services/vnpay.service.ts
import * as crypto from 'crypto';
import * as querystring from 'qs';

interface VnpayPaymentParams {
  orderId: string;        // Unique order/transaction ID
  amount: number;         // Amount in VND (integer, no decimals)
  orderInfo: string;      // Description: "Phí ăn xế T10/2024 - Nguyễn Văn A"
  ipAddr: string;         // Client IP address
  locale?: 'vn' | 'en';
}

function createPaymentUrl(params: VnpayPaymentParams): string {
  const vnpParams: Record<string, string> = {
    vnp_Amount: String(params.amount * 100),  // VNPAY requires amount × 100
    vnp_Command: 'pay',
    vnp_CreateDate: formatDate(new Date()),   // yyyyMMddHHmmss
    vnp_CurrCode: 'VND',
    vnp_IpAddr: params.ipAddr,
    vnp_Locale: params.locale || 'vn',
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_TxnRef: params.orderId,
    vnp_Version: '2.1.0',
  };

  // ⚠️ CRITICAL: Sort alphabetically BEFORE signing
  const sortedParams = sortObject(vnpParams);

  // Generate HMAC-SHA512 checksum
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sortedParams['vnp_SecureHash'] = hmac;

  return `${process.env.VNPAY_PAYMENT_URL}?${querystring.stringify(sortedParams, { encode: false })}`;
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {} as Record<string, string>);
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
```

### 2.3 IPN (Instant Payment Notification) Handler

**CRITICAL: IPN handling MUST be idempotent. Verify signature server-to-server.**

```typescript
// controllers/payments.controller.ts

@Post('vnpay-ipn')
async handleVnpayIPN(@Query() query: Record<string, string>, @Res() res: Response) {
  // 1. Extract and verify secure hash
  const secureHash = query['vnp_SecureHash'];
  delete query['vnp_SecureHash'];
  delete query['vnp_SecureHashType'];

  const sortedParams = this.vnpayService.sortObject(query);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const computedHash = crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  if (secureHash !== computedHash) {
    return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
  }

  // 2. Find the payment record
  const orderId = query['vnp_TxnRef'];
  const payment = await this.paymentService.findByOrderId(orderId);

  if (!payment) {
    return res.status(200).json({ RspCode: '01', Message: 'Order Not Found' });
  }

  // 3. Idempotency check — already processed?
  if (payment.status === 'PAID') {
    return res.status(200).json({ RspCode: '02', Message: 'Already Updated' });
  }

  // 4. Verify amount matches
  const vnpAmount = parseInt(query['vnp_Amount']) / 100;
  if (vnpAmount !== payment.amount) {
    return res.status(200).json({ RspCode: '04', Message: 'Invalid Amount' });
  }

  // 5. Check transaction status
  const responseCode = query['vnp_ResponseCode'];
  if (responseCode === '00') {
    // SUCCESS — update payment status
    await this.paymentService.markAsPaid(orderId, {
      vnpTransactionNo: query['vnp_TransactionNo'],
      vnpBankCode: query['vnp_BankCode'],
      vnpPayDate: query['vnp_PayDate'],
    });
    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } else {
    // FAILED
    await this.paymentService.markAsFailed(orderId, responseCode);
    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  }
}
```

---

## 3. Database Schema

```sql
-- Snack service registration
CREATE TABLE snack_service_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  month INT NOT NULL,           -- 1-12
  year INT NOT NULL,
  status VARCHAR(20) DEFAULT 'REGISTERED',  -- REGISTERED, PENDING_PAYMENT, PAID, CANCELLED
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) UNIQUE NOT NULL,    -- vnp_TxnRef
  registration_id UUID REFERENCES snack_service_registrations(id),
  amount DECIMAL(12,0) NOT NULL,           -- VND
  status VARCHAR(20) DEFAULT 'PENDING',    -- PENDING, PAID, FAILED, REFUNDED
  vnp_transaction_no VARCHAR(50),
  vnp_bank_code VARCHAR(20),
  vnp_pay_date VARCHAR(14),
  vnp_response_code VARCHAR(5),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Module Structure

```
apps/backend/src/modules/payments/
├── controllers/
│   └── payments.controller.ts       # Create URL + IPN + Return
├── dto/
│   ├── create-payment.dto.ts
│   └── vnpay-ipn-query.dto.ts
├── entities/
│   ├── payment-transaction.entity.ts
│   └── snack-service-registration.entity.ts
├── services/
│   ├── payments.service.ts          # CRUD + status management
│   └── vnpay.service.ts             # URL signing + verification
└── payments.module.ts
```

```
apps/backend/src/modules/snack-services/
├── controllers/
│   └── snack-services.controller.ts # Registration CRUD
├── dto/
│   └── register-snack.dto.ts
├── services/
│   └── snack-services.service.ts
└── snack-services.module.ts
```

---

## 5. Frontend Payment Flow

### 5.1 Parent Payment Page
Location: `apps/frontend/src/features/payments/pages/SnackBillingPaymentPage.tsx`

```tsx
// Flow:
// 1. Display unpaid registrations for parent's children
// 2. Parent clicks "Thanh toán" → POST /api/v1/payments/create-url
// 3. Redirect to VNPAY payment page
// 4. VNPAY redirects back to /payments/vnpay-return with query params
// 5. Frontend displays success/failure based on vnp_ResponseCode
```

### 5.2 VNPAY Return URL Handler
```tsx
// Parse VNPAY return params
const params = new URLSearchParams(window.location.search);
const responseCode = params.get('vnp_ResponseCode');

if (responseCode === '00') {
  // Show success UI
} else {
  // Show failure UI with error message
}
```

---

## 6. API Endpoints
```
POST /api/v1/payments/create-url         → Generate VNPAY payment URL
GET  /api/v1/payments/vnpay-ipn          → VNPAY IPN callback (server-to-server)
GET  /api/v1/payments/vnpay-return       → VNPAY return redirect
GET  /api/v1/payments/history            → Payment history for parent
POST /api/v1/snack-services/register     → Register child for snack service
GET  /api/v1/snack-services              → List registrations
```

---

## 7. Key Conventions
- **Always sort parameters alphabetically** before HMAC-SHA512.
- IPN handler must **always return HTTP 200** with RspCode JSON.
- Payment amounts are in **VND (integer)**, VNPAY expects `amount × 100`.
- Use `order_id` as the **idempotency key** — never process the same order twice.
- VNPAY Sandbox test cards: `9704198526191432198` / `NGUYEN VAN A` / `07/15` / OTP: `123456`.
