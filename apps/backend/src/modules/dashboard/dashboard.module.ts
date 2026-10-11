import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Child } from '../children/entities/child.entity';
import { DailyMealAttendance } from '../attendance/entities/daily-meal-attendance.entity';
import { Menu } from '../menus/entities/menu.entity';
import { GrowthRecord, GrowthZscore } from '../growth/entities/growth-record.entity';
import { ChildAllergy } from '../children/entities/child-allergy.entity';
import { SnackRegistration } from '../snack-services/entities/snack-registration.entity';
import { Payment } from '../payments/entities/payment.entity';
import { InspectionRecord } from '../inspections/entities/inspection-record.entity';
import { InspectionSampleItem } from '../inspections/entities/inspection-sample-item.entity';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Child,
      DailyMealAttendance,
      Menu,
      GrowthRecord,
      GrowthZscore,
      ChildAllergy,
      SnackRegistration,
      Payment,
      InspectionRecord,
      InspectionSampleItem,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
