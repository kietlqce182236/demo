import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, TwoFactorService],
  exports: [AuthService, TwoFactorService, JwtModule],
})
export class AuthModule {}
