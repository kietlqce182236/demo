import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyMealPortionEntity } from './entities/daily-meal-portion.entity';
import { MealPortionIngredientEntity } from './entities/meal-portion-ingredient.entity';
import { WeeklyMenuPlanItemEntity } from './entities/weekly-menu-plan-item.entity';
import { WeeklyNutritionStatEntity } from './entities/weekly-nutrition-stat.entity';
import { MealPortionsService } from './services/meal-portions.service';
import { MealPortionsController } from '../../controllers/meal-portions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyMealPortionEntity,
      MealPortionIngredientEntity,
      WeeklyMenuPlanItemEntity,
      WeeklyNutritionStatEntity,
    ]),
  ],
  controllers: [MealPortionsController],
  providers: [MealPortionsService],
  exports: [MealPortionsService],
})
export class MealPortionsModule {}
