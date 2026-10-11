import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentEvaluation, EvaluationReply } from './entities/parent-evaluation.entity';
import { Child } from '../children/entities/child.entity';
import { DailyMealAttendance } from '../attendance/entities/daily-meal-attendance.entity';
import { ParentEvaluationService } from './services/parent-evaluation.service';
import { ParentEvaluationsController } from './controllers/parent-evaluations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentEvaluation,
      EvaluationReply,
      Child,
      DailyMealAttendance,
    ]),
  ],
  controllers: [ParentEvaluationsController],
  providers: [ParentEvaluationService],
  exports: [ParentEvaluationService],
})
export class ParentEvaluationsModule {}
