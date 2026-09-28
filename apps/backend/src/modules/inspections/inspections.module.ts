import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { InspectionRecord } from './entities/inspection-record.entity';
import { InspectionSampleItem } from './entities/inspection-sample-item.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRecord, InspectionSampleItem]),
    ScheduleModule.forRoot(), // for cron jobs
  ],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
