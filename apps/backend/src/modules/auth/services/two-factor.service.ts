import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  constructor() {
    authenticator.options = {
      window: 1, // Chấp nhận sai số thời gian 30 giây
    };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, 'KidsNutriJournal Preschool', secret);
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  verifyCode(code: string, secret: string): boolean {
    return authenticator.verify({
      token: code,
      secret,
    });
  }
}
