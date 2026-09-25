import { TwoFactorService } from '../../../src/modules/auth/services/two-factor.service';
import { authenticator } from 'otplib';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(() => {
    service = new TwoFactorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('nên sinh ra secret key hợp lệ (chuỗi không rỗng)', () => {
      const secret = service.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('generateOtpAuthUrl', () => {
    it('nên tạo URL otpauth chuẩn chứa email và issuer', () => {
      const email = 'teacher@kidmeal.edu.vn';
      const secret = service.generateSecret();
      const otpUrl = service.generateOtpAuthUrl(email, secret);

      expect(otpUrl).toContain('otpauth://totp/');
      expect(otpUrl).toContain(encodeURIComponent(email));
      expect(otpUrl).toContain(secret);
      expect(otpUrl).toContain('KidsNutriJournal');
    });
  });

  describe('generateQrCodeDataUrl', () => {
    it('nên sinh ra chuỗi Base64 Data URL của ảnh QR Code', async () => {
      const otpUrl = 'otpauth://totp/KidsNutriJournal:test@kidmeal.edu.vn?secret=JBSWY3DPEHPK3PXP';
      const qrDataUrl = await service.generateQrCodeDataUrl(otpUrl);

      expect(qrDataUrl).toBeDefined();
      expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    });
  });

  describe('verifyCode', () => {
    it('nên trả về true khi mã OTP khớp với secret', () => {
      const secret = service.generateSecret();
      const currentToken = authenticator.generate(secret);

      const isValid = service.verifyCode(currentToken, secret);
      expect(isValid).toBe(true);
    });

    it('nên trả về false khi mã OTP sai', () => {
      const secret = service.generateSecret();
      const invalidToken = '000000';

      const isValid = service.verifyCode(invalidToken, secret);
      expect(isValid).toBe(false);
    });
  });
});
