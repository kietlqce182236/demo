import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { BreakfastSubscription } from './entities/breakfast-subscription.entity';
import { SnackRegistration } from '../snack-services/entities/snack-registration.entity';
import { SnackServicePeriod } from '../snack-services/entities/snack-service-period.entity';
import { Child } from '../children/entities/child.entity';
import { VnpayService } from './services/vnpay.service';
import { PaymentsController } from './controllers/payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      BreakfastSubscription,
      SnackRegistration,
      SnackServicePeriod,
      Child,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [VnpayService],
  exports: [VnpayService, TypeOrmModule],
})
export class PaymentsModule {}
