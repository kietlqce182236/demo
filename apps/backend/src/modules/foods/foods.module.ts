import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { FoodCategory } from './entities/food-category.entity';
import { FoodsService } from './services/foods.service';
import { FoodsController } from './controllers/foods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Food, FoodCategory])],
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService, TypeOrmModule],
})
export class FoodsModule {}
