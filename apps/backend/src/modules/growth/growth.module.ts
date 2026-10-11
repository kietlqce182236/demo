import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrowthRecord, GrowthZscore } from './entities/growth-record.entity';
import { WhoGrowthStandard } from './entities/who-growth-standard.entity';
import { Child } from '../children/entities/child.entity';
import { WhoZscoreService } from './services/who-zscore.service';
import { GrowthService } from './services/growth.service';
import { GrowthController } from './controllers/growth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GrowthRecord,
      GrowthZscore,
      WhoGrowthStandard,
      Child,
    ]),
  ],
  controllers: [GrowthController],
  providers: [GrowthService, WhoZscoreService],
  exports: [GrowthService, WhoZscoreService],
})
export class GrowthModule {}
