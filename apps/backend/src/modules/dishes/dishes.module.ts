import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { DishCategory } from './entities/dish-category.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { DishNutrition } from './entities/dish-nutrition.entity';
import { DishAllergen } from './entities/dish-allergen.entity';
import { Food } from '../foods/entities/food.entity';
import { DishesService } from './dishes.service';
import { DishesController } from './dishes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dish, DishCategory, RecipeItem, DishNutrition, Food, DishAllergen]),
  ],
  controllers: [DishesController],
  providers: [DishesService],
  exports: [DishesService, TypeOrmModule],
})
export class DishesModule {}
