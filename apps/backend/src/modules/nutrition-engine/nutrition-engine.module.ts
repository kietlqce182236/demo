import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionRule } from './entities/nutrition-rule.entity';
import { AllergenCatalog } from './entities/allergen-catalog.entity';
import { RuleViolationLog } from './entities/rule-violation-log.entity';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { AllergyValidatorService } from './services/allergy-validator.service';
import { RuleEngineService } from './services/rule-engine.service';
import { NutritionRulesService } from './services/nutrition-rules.service';
import { AllergenRulesService } from './services/allergen-rules.service';
import { MenuScannerService } from './services/menu-scanner.service';
import { NutritionStandardsController } from './controllers/nutrition-standards.controller';
import { AllergenRulesController } from './controllers/allergen-rules.controller';
import { MenuScannerController } from './controllers/menu-scanner.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NutritionRule, AllergenCatalog, RuleViolationLog]),
  ],
  controllers: [
    NutritionStandardsController,
    AllergenRulesController,
    MenuScannerController,
  ],
  providers: [
    NutritionCalculatorService,
    AllergyValidatorService,
    RuleEngineService,
    NutritionRulesService,
    AllergenRulesService,
    MenuScannerService,
  ],
  exports: [
    NutritionCalculatorService,
    AllergyValidatorService,
    RuleEngineService,
    NutritionRulesService,
    AllergenRulesService,
    MenuScannerService,
  ],
})
export class NutritionEngineModule {}
