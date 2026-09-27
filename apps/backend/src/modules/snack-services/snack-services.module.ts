import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnackServiceEntity } from './entities/snack-service.entity';
import { SnackServicePeriodEntity } from './entities/snack-service-period.entity';
import { SnackServicesService } from './snack-services.service';
import { SnackServicesController } from '../../controller/snack-services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SnackServiceEntity, SnackServicePeriodEntity])],
  controllers: [SnackServicesController],
  providers: [SnackServicesService],
  exports: [SnackServicesService],
})
export class SnackServicesModule {}

