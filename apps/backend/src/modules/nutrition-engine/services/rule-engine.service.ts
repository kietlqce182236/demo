import { Injectable } from '@nestjs/common';
import { MenuScannerService } from './menu-scanner.service';
import { NutritionRulesService } from './nutrition-rules.service';
import { EvaluateMenuDto } from '../dto/evaluate-menu.dto';

@Injectable()
export class RuleEngineService {
  constructor(
    private readonly scanner: MenuScannerService,
    private readonly rules: NutritionRulesService,
  ) {}

  async evaluateMenu(dto: EvaluateMenuDto) {
    return this.scanner.evaluateMenu(dto);
  }

  async getRules() {
    return this.rules.findAll();
  }
}
