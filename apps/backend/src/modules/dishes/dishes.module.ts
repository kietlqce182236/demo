import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishesService } from './dishes.service';
import { DishesController } from './dishes.controller';
import { Dish } from './entities/dish.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { Food } from '../foods/entities/food.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, RecipeItem, Food])],
  controllers: [DishesController],
  providers: [DishesService],
})
export class DishesModule {}
