import { Module } from '@nestjs/common';
import { WhoZScoreService } from './services/who-zscore.service';

@Module({
  providers: [WhoZScoreService],
  exports: [WhoZScoreService],
})
export class GrowthModule {}
