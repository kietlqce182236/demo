import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { TenantFood } from './entities/tenant-food.entity';
import { FoodsController } from './controllers/foods.controller';
import { FoodsService } from './services/foods.service';

@Module({
  imports: [TypeOrmModule.forFeature([Food, TenantFood])],
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
