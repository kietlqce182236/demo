import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { NutritionRulesService } from '../../../src/modules/nutrition-engine/services/nutrition-rules.service';
import { NutritionRule } from '../../../src/modules/nutrition-engine/entities/nutrition-rule.entity';
import { AllergenCatalog } from '../../../src/modules/nutrition-engine/entities/allergen-catalog.entity';
import { RuleViolationLog } from '../../../src/modules/nutrition-engine/entities/rule-violation-log.entity';

describe('NutritionRulesService', () => {
  let service: NutritionRulesService;
  let ruleRepoMock: any;
  let allergenRepoMock: any;
  let violationRepoMock: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockRuleId = 'rule-uuid-1';

  const mockRule: Partial<NutritionRule> = {
    id: mockRuleId,
    tenantId: mockTenantId,
    name: 'Chuẩn dinh dưỡng Mẫu giáo Sao Mai',
    targetAgeGroup: 'KINDERGARTEN_3_4Y',
    mealScope: 'FULL_DAY_SCHOOL',
    minCaloriesKcal: 615,
    maxCaloriesKcal: 726,
    minProteinPercent: 13,
    maxProteinPercent: 20,
    minFatPercent: 25,
    maxFatPercent: 35,
    minCarbPercent: 52,
    maxCarbPercent: 60,
    minCalciumMg: 350,
    minIronMg: 5,
    minZincMg: 3,
    maxSodiumMg: 1500,
    caPRatioMin: 1.0,
    caPRatioMax: 1.5,
    isStrict: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockSystemRule: Partial<NutritionRule> = {
    ...mockRule,
    id: 'system-rule-1',
    tenantId: null, // System rule Bộ GD&ĐT
    name: 'Quy chuẩn Bộ GD&ĐT Thông tư 28',
  };

  beforeEach(async () => {
    ruleRepoMock = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((r) => Promise.resolve({ id: 'saved-id', ...r })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      restore: jest.fn().mockResolvedValue({ affected: 1 }),
      manager: {
        query: jest.fn().mockResolvedValue([{ count: '8' }]),
      },
    };

    allergenRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(8),
      }),
    };

    violationRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionRulesService,
        { provide: getRepositoryToken(NutritionRule), useValue: ruleRepoMock },
        { provide: getRepositoryToken(AllergenCatalog), useValue: allergenRepoMock },
        { provide: getRepositoryToken(RuleViolationLog), useValue: violationRepoMock },
      ],
    }).compile();

    service = module.get<NutritionRulesService>(NutritionRulesService);
  });

  describe('getNutritionRules', () => {
    it('phải trả về danh sách quy chuẩn dinh dưỡng kèm cờ isSystemRule', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRule, mockSystemRule]),
      };
      ruleRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const rules = await service.getNutritionRules(mockTenantId, {
        targetAgeGroup: 'KINDERGARTEN_3_4Y',
      });

      expect(rules).toHaveLength(2);
      expect(rules[0].isSystemRule).toBe(false);
      expect(rules[1].isSystemRule).toBe(true);
    });
  });

  describe('createNutritionRule', () => {
    it('phải tạo quy chuẩn dinh dưỡng mới thành công', async () => {
      const result = await service.createNutritionRule(mockTenantId, {
        name: 'Chuẩn Nhà trẻ',
        targetAgeGroup: 'TODDLER_18_36M',
        minCaloriesKcal: 600,
        maxCaloriesKcal: 735,
        minProteinPercent: 13,
        maxProteinPercent: 20,
        minFatPercent: 30,
        maxFatPercent: 40,
        minCarbPercent: 47,
        maxCarbPercent: 50,
      });

      expect(result.name).toBe('Chuẩn Nhà trẻ');
      expect(ruleRepoMock.create).toHaveBeenCalled();
      expect(ruleRepoMock.save).toHaveBeenCalled();
    });

    it('phải ném BadRequestException nếu maxCalories < minCalories', async () => {
      await expect(
        service.createNutritionRule(mockTenantId, {
          name: 'Lỗi Calo',
          targetAgeGroup: 'TODDLER_18_36M',
          minCaloriesKcal: 800,
          maxCaloriesKcal: 500, // Sai
          minProteinPercent: 13,
          maxProteinPercent: 20,
          minFatPercent: 30,
          maxFatPercent: 40,
          minCarbPercent: 47,
          maxCarbPercent: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('softDeleteNutritionRule', () => {
    it('phải thực hiện xóa mềm quy chuẩn tùy biến của trường', async () => {
      ruleRepoMock.findOne.mockResolvedValue(mockRule);

      const res = await service.softDeleteNutritionRule(mockRuleId, mockTenantId);

      expect(res.success).toBe(true);
      expect(ruleRepoMock.softDelete).toHaveBeenCalledWith({
        id: mockRuleId,
        tenantId: mockTenantId,
      });
      expect(ruleRepoMock.update).toHaveBeenCalledWith(
        { id: mockRuleId, tenantId: mockTenantId },
        { isActive: false },
      );
    });

    it('phải từ chối xóa quy chuẩn gốc quốc gia của Bộ GD&ĐT', async () => {
      ruleRepoMock.findOne.mockResolvedValue(mockSystemRule);

      await expect(
        service.softDeleteNutritionRule('system-rule-1', mockTenantId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restoreNutritionRule', () => {
    it('phải khôi phục quy chuẩn dinh dưỡng đã xóa mềm', async () => {
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockRule),
      };
      ruleRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const res = await service.restoreNutritionRule(mockRuleId, mockTenantId);

      expect(res.success).toBe(true);
      expect(ruleRepoMock.restore).toHaveBeenCalledWith({
        id: mockRuleId,
        tenantId: mockTenantId,
      });
      expect(ruleRepoMock.update).toHaveBeenCalledWith(
        { id: mockRuleId, tenantId: mockTenantId },
        { isActive: true },
      );
    });
  });

  describe('getNutritionStats', () => {
    it('phải trả về các chỉ số KPI thống kê đầy đủ', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      ruleRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const stats = await service.getNutritionStats(mockTenantId);

      expect(stats.activeRulesCount).toBe(3);
      expect(stats.allergicChildrenCount).toBe(8);
      expect(stats.configuredAllergensCount).toBe(8);
      expect(stats.nutritionWarningsCount).toBe(2);
      expect(stats.complianceRatePercent).toBeGreaterThan(0);
    });
  });
});
