import { Test, TestingModule } from '@nestjs/testing';
import { NutritionRulesService } from '../../../src/modules/nutrition-engine/services/nutrition-rules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NutritionalStandard } from '../../../src/modules/nutrition-engine/entities/nutrition-rule.entity';

describe('NutritionRulesService', () => {
  let service: NutritionRulesService;
  let mockRuleRepo: any;

  beforeEach(async () => {
    mockRuleRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          ageGroup: 'MAU_GIAO',
          mealScope: 'FULL_DAY',
          minEnergyKcal: 615,
          maxEnergyKcal: 726,
          minProteinPct: 13,
          maxProteinPct: 20,
          minFatPct: 25,
          maxFatPct: 35,
          minCarbPct: 52,
          maxCarbPct: 60,
          status: 'ACTIVE',
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionRulesService,
        { provide: getRepositoryToken(NutritionalStandard), useValue: mockRuleRepo },
      ],
    }).compile();

    service = module.get<NutritionRulesService>(NutritionRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all nutritional rules complying with Circular 28', async () => {
    const rules = await service.findAll();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('minEnergyKcal', 615);
    expect(rules[0]).toHaveProperty('maxEnergyKcal', 726);
  });
});
