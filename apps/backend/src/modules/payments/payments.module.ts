import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { VnpayService } from './services/vnpay.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [VnpayService],
  exports: [VnpayService],
})
export class PaymentsModule {}
