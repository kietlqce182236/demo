import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ChildEntity } from './entities/child.entity';
import { ChildAllergyEntity } from './entities/child-allergy.entity';
import { DailyMealAttendanceEntity } from './entities/daily-meal-attendance.entity';
import { ClassMealEvaluationEntity } from './entities/class-meal-evaluation.entity';
import { MealConsumptionStatusEntity } from './entities/meal-consumption-status.entity';
import { MealCoordinationNoteEntity } from './entities/meal-coordination-note.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { AttendanceService } from './services/attendance.service';
import { AttendanceController } from './attendance.controller';
import { SnackRegistrationEntity } from './entities/snack-registration.entity';
import { SnackRosterService } from './services/snack-roster.service';
import { SnackRosterController } from '../../controllers/snack-roster.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassEntity,
      ChildEntity,
      ChildAllergyEntity,
      DailyMealAttendanceEntity,
      ClassMealEvaluationEntity,
      MealConsumptionStatusEntity,
      MealCoordinationNoteEntity,
      SnackRegistrationEntity,
    ]),
    WebsocketModule,
  ],
  controllers: [AttendanceController, SnackRosterController],
  providers: [AttendanceService, SnackRosterService],
  exports: [AttendanceService, SnackRosterService],
})
export class AttendanceModule {}
