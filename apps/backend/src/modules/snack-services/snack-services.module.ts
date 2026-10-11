import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnackServicePeriod } from './entities/snack-service-period.entity';
import { SnackRegistration } from './entities/snack-registration.entity';
import { Child } from '../children/entities/child.entity';
import { SnackServicesService } from './snack-services.service';
import { SnackServicesController } from './snack-services.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SnackServicePeriod, SnackRegistration, Child]),
  ],
  controllers: [SnackServicesController],
  providers: [SnackServicesService],
  exports: [SnackServicesService, TypeOrmModule],
})
export class SnackServicesModule {}
