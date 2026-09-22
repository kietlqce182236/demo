import { Module } from '@nestjs/common';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { AllergyValidatorService } from './services/allergy-validator.service';
import { RuleEngineService } from './services/rule-engine.service';

@Module({
  providers: [NutritionCalculatorService, AllergyValidatorService, RuleEngineService],
  exports: [NutritionCalculatorService, AllergyValidatorService, RuleEngineService],
})
export class NutritionEngineModule {}
