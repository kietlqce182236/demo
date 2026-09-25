import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ChildEntity } from './entities/child.entity';
import { ChildAllergyEntity } from './entities/child-allergy.entity';
import { DailyMealAttendanceEntity } from './entities/daily-meal-attendance.entity';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassEntity,
      ChildEntity,
      ChildAllergyEntity,
      DailyMealAttendanceEntity,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
