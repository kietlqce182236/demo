import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyMealAttendance } from './entities/daily-meal-attendance.entity';
import { MealCoordinationNote } from './entities/meal-coordination-note.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Child } from '../children/entities/child.entity';
import { AttendanceService } from './services/attendance.service';
import { MealCoordinationService } from './services/meal-coordination.service';
import { SnackRosterService } from './services/snack-roster.service';
import { AttendanceController } from './attendance.controller';

import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyMealAttendance,
      MealCoordinationNote,
      ClassEntity,
      Child,
    ]),
    InspectionsModule,
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    MealCoordinationService,
    SnackRosterService,
  ],
  exports: [AttendanceService, MealCoordinationService, SnackRosterService, TypeOrmModule],
})
export class AttendanceModule {}
