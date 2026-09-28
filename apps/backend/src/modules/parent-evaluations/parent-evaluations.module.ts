import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentEvaluationEntity } from './entities/parent-evaluation.entity';
import { ParentEvaluationService } from './services/parent-evaluation.service';
import { ParentEvaluationController } from '../../controllers/parent-evaluation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParentEvaluationEntity])],
  controllers: [ParentEvaluationController],
  providers: [ParentEvaluationService],
  exports: [ParentEvaluationService],
})
export class ParentEvaluationsModule {}
