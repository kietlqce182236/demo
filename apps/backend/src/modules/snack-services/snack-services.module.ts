import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnackServiceEntity } from './entities/snack-service.entity';
import { SnackServicesService } from './snack-services.service';
import { SnackServicesController } from '../../controller/snack-services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SnackServiceEntity])],
  controllers: [SnackServicesController],
  providers: [SnackServicesService],
  exports: [SnackServicesService],
})
export class SnackServicesModule {}
