import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from '../../../src/modules/menus/services/menus.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Menu } from '../../../src/modules/menus/entities/menu.entity';
import { MenuVersion } from '../../../src/modules/menus/entities/menu-version.entity';
import { MenuDay } from '../../../src/modules/menus/entities/menu-day.entity';
import { MenuMeal } from '../../../src/modules/menus/entities/menu-meal.entity';
import { MenuDish } from '../../../src/modules/menus/entities/menu-dish.entity';
import { MenuCycle } from '../../../src/modules/menus/entities/menu-cycle.entity';
import { Dish } from '../../../src/modules/dishes/entities/dish.entity';
import { NutritionalStandard } from '../../../src/modules/menus/entities/nutritional-standard.entity';
import { MenuRuleViolation } from '../../../src/modules/menus/entities/menu-rule-violation.entity';

describe('MenusService', () => {
  let service: MenusService;
  let mockMenuRepo: any;

  beforeEach(async () => {
    mockMenuRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: getRepositoryToken(Menu), useValue: mockMenuRepo },
        { provide: getRepositoryToken(MenuVersion), useValue: {} },
        { provide: getRepositoryToken(MenuDay), useValue: {} },
        { provide: getRepositoryToken(MenuMeal), useValue: {} },
        { provide: getRepositoryToken(MenuDish), useValue: {} },
        { provide: getRepositoryToken(MenuCycle), useValue: {} },
        { provide: getRepositoryToken(Dish), useValue: {} },
        { provide: getRepositoryToken(NutritionalStandard), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(MenuRuleViolation), useValue: { find: jest.fn(), save: jest.fn() } },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list menus with pagination', async () => {
    const res = await service.findAll({});
    expect(res).toHaveProperty('items');
    expect(res).toHaveProperty('total', 0);
  });
});
