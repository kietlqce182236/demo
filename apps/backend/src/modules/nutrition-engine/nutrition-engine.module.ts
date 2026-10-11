import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionalStandard } from './entities/nutrition-rule.entity';
import { RuleViolationLog } from './entities/rule-violation-log.entity';
import { AllergenCatalog } from '../children/entities/allergen-catalog.entity';
import { Dish } from '../dishes/entities/dish.entity';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { MenuScannerService } from './services/menu-scanner.service';
import { AllergyValidatorService } from './services/allergy-validator.service';
import { NutritionRulesService } from './services/nutrition-rules.service';
import { AllergenRulesService } from './services/allergen-rules.service';
import { RuleEngineService } from './services/rule-engine.service';
import { NutritionStandardsController } from './controllers/nutrition-standards.controller';
import { AllergenRulesController } from './controllers/allergen-rules.controller';
import { MenuScannerController } from './controllers/menu-scanner.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NutritionalStandard,
      RuleViolationLog,
      AllergenCatalog,
      Dish,
    ]),
  ],
  controllers: [
    NutritionStandardsController,
    AllergenRulesController,
    MenuScannerController,
  ],
  providers: [
    NutritionCalculatorService,
    MenuScannerService,
    AllergyValidatorService,
    NutritionRulesService,
    AllergenRulesService,
    RuleEngineService,
  ],
  exports: [
    NutritionCalculatorService,
    MenuScannerService,
    AllergyValidatorService,
    NutritionRulesService,
    AllergenRulesService,
    RuleEngineService,
    TypeOrmModule,
  ],
})
export class NutritionEngineModule {}
