import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Child } from '../children/entities/child.entity';
import { SchoolTenant } from '../auth/entities/tenant.entity';
import { FinancesService } from './services/finances.service';
import { FinancesController } from './controllers/finances.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      ClassEntity,
      Child,
      SchoolTenant,
    ]),
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
  exports: [FinancesService],
})
export class FinancesModule {}
