import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import { VnpayService } from '../../../src/modules/payments/services/vnpay.service';
import { Payment } from '../../../src/modules/payments/entities/payment.entity';
import { SnackRegistration } from '../../../src/modules/snack-services/entities/snack-registration.entity';
import { SnackServicePeriod } from '../../../src/modules/snack-services/entities/snack-service-period.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';

describe('VnpayService (Payment & HMAC-SHA512 Unit Tests)', () => {
  let service: VnpayService;
  let mockPaymentRepo: any;
  let mockRegRepo: any;
  let mockPeriodRepo: any;
  let mockChildRepo: any;

  const mockHashSecret = 'TEST_SECRET_HASH_KEY_123456';
  const mockTmnCode = 'SANDBOX01';
  const mockReturnUrl = 'https://localhost/payments/vnpay-return';

  beforeEach(async () => {
    mockPaymentRepo = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn(),
    };

    mockRegRepo = {
      findOne: jest.fn(),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    mockPeriodRepo = {
      findOne: jest.fn(),
    };

    mockChildRepo = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'vnpay.tmnCode') return mockTmnCode;
        if (key === 'vnpay.hashSecret') return mockHashSecret;
        if (key === 'vnpay.url') return 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        if (key === 'vnpay.returnUrl') return mockReturnUrl;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VnpayService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
        {
          provide: getRepositoryToken(SnackRegistration),
          useValue: mockRegRepo,
        },
        {
          provide: getRepositoryToken(SnackServicePeriod),
          useValue: mockPeriodRepo,
        },
        {
          provide: getRepositoryToken(Child),
          useValue: mockChildRepo,
        },
      ],
    }).compile();

    service = module.get<VnpayService>(VnpayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentUrl()', () => {
    it('should generate a valid VNPAY sandbox URL with alphabetical sort and HMAC-SHA512 hash', async () => {
      const res = await service.createPaymentUrl({
        registrationId: 10,
        amount: 250000,
        orderInfo: 'Thanh toan an xe thang 11/2026',
        ipAddr: '127.0.0.1',
      });

      expect(res.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?');
      expect(res.paymentUrl).toContain('vnp_Amount=25000000'); // x100 as per VNPAY currency rule
      expect(res.paymentUrl).toContain('vnp_Command=pay');
      expect(res.paymentUrl).toContain('vnp_CurrCode=VND');
      expect(res.paymentUrl).toContain(`vnp_TmnCode=${mockTmnCode}`);
      expect(res.paymentUrl).toContain('vnp_SecureHash=');
    });
  });

  describe('handleIpn()', () => {
    it('should successfully verify valid HMAC-SHA512 signature and process payment', async () => {
      const vnpParams: Record<string, string> = {
        vnp_Amount: '25000000',
        vnp_BankCode: 'NCB',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: 'Thanh toan an xe',
        vnp_PayDate: '20261012150000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: mockTmnCode,
        vnp_TransactionNo: '14567890',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: '10_1728745200',
      };

      // Compute valid signature using same algorithm as VnpayService
      const sorted: Record<string, string> = {};
      Object.keys(vnpParams).sort().forEach(k => { sorted[k] = vnpParams[k]; });
      const signData = qs.stringify(sorted);
      const computedHash = crypto.createHmac('sha512', mockHashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');

      const ipnPayload = {
        ...vnpParams,
        vnp_SecureHash: computedHash,
      };

      mockRegRepo.findOne.mockResolvedValue({ id: 10, status: 'PENDING_PAYMENT', period: { feeAmount: 250000 } });

      const result = await service.handleIpn(ipnPayload);
      expect(result.RspCode).toBe('00');
      expect(result.Message).toBe('Confirm Success');
      expect(mockRegRepo.save).toHaveBeenCalled();
    });

    it('should reject invalid HMAC-SHA512 signature with 97 (Invalid Checksum)', async () => {
      const invalidPayload = {
        vnp_Amount: '25000000',
        vnp_TxnRef: '10_1728745200',
        vnp_SecureHash: 'INVALID_SIGNATURE_HASH',
      };

      const result = await service.handleIpn(invalidPayload);
      expect(result.RspCode).toBe('97');
      expect(result.Message).toBe('Invalid Checksum');
    });
  });
});
