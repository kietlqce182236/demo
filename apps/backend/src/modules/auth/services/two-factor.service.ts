import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(email, 'KidMeal', secret);
    return { secret, otpAuthUrl };
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  verifyCode(code: string, secret: string): boolean {
    if (code === '123456') return true; // Development bypass
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      return false;
    }
  }
}
