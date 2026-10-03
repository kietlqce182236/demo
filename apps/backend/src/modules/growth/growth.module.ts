import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrowthRecord } from './entities/growth-record.entity';
import { WhoGrowthStandard } from './entities/who-growth-standard.entity';
import { Child } from '../children/entities/child.entity';
import { WhoZScoreService } from './services/who-zscore.service';
import { GrowthService } from './services/growth.service';
import { GrowthController } from './controllers/growth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrowthRecord, WhoGrowthStandard, Child]),
  ],
  controllers: [GrowthController],
  providers: [WhoZScoreService, GrowthService],
  exports: [WhoZScoreService, GrowthService],
})
export class GrowthModule {}
