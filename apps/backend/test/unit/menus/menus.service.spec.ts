import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenusService } from '../../../src/modules/menus/services/menus.service';
import { Menu } from '../../../src/modules/menus/entities/menu.entity';
import { MenuDish } from '../../../src/modules/menus/entities/menu-dish.entity';
import { Dish } from '../../../src/modules/menus/entities/dish.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MenusService', () => {
  let service: MenusService;
  let menuRepo: any;
  let menuDishRepo: any;
  let dishRepo: any;
  let currentMenuState: any;

  const mockTenantId = 'a0000000-0000-0000-0000-000000000001';
  const mockUserId = '10000000-0000-0000-0000-000000000002';

  const mockMenu: Partial<Menu> = {
    id: 'm1000000-0000-0000-0000-000000000001',
    tenantId: mockTenantId,
    title: 'Thực đơn tuần 38',
    menuCycleType: 'WEEKLY',
    targetAgeGroup: 'ALL_AGES',
    startDate: '2026-09-21',
    endDate: '2026-09-25',
    cycleWeekNumber: 38,
    status: 'DRAFT',
    version: 1,
    parentMenuId: null,
    dailyAverageCalories: 780,
    dailyAverageProteinG: 28,
    dailyAverageFatG: 22,
    dailyAverageCarbG: 110,
    isPublished: false,
    deletedAt: null,
    menuDishes: [],
  };

  const mockDish: Partial<Dish> = {
    id: 'd1000000-0000-0000-0000-000000000001',
    name: 'Cơm trắng dẻo',
    standardServingSizeG: 100,
    totalCalories: 172,
    totalProteinG: 3.8,
    totalFatG: 0.35,
    totalCarbG: 38.1,
  };

  beforeEach(async () => {
    currentMenuState = { ...mockMenu };

    menuRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockMenu]),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      }),
      find: jest.fn().mockResolvedValue([mockMenu]),
      findOne: jest.fn().mockImplementation(() => Promise.resolve({ ...currentMenuState })),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'm-new-uuid' })),
      save: jest.fn().mockImplementation((menu) => {
        currentMenuState = { ...currentMenuState, ...menu };
        return Promise.resolve(currentMenuState);
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    menuDishRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'md-new-uuid' })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
    };

    dishRepo = {
      find: jest.fn().mockResolvedValue([mockDish]),
      findOne: jest.fn().mockResolvedValue(mockDish),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'dish-new-uuid' })),
      save: jest.fn().mockImplementation((dish) => Promise.resolve(dish)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: getRepositoryToken(Menu), useValue: menuRepo },
        { provide: getRepositoryToken(MenuDish), useValue: menuDishRepo },
        { provide: getRepositoryToken(Dish), useValue: dishRepo },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of menus', async () => {
      const result = await service.findAll(mockTenantId, {});
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Thực đơn tuần 38');
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const stats = await service.getStatistics(mockTenantId);
      expect(stats.total).toBe(1);
      expect(stats.draft).toBe(1);
      expect(stats.avgCalories).toBe(780);
      expect(stats.nutritionStandard).toContain('28/2016/TT-BGDĐT');
    });
  });

  describe('create', () => {
    it('should create new draft menu with version 1', async () => {
      const result = await service.create(mockTenantId, mockUserId, {
        title: 'Thực đơn tuần 39',
        startDate: '2026-09-28',
        endDate: '2026-10-02',
        cycleWeekNumber: 39,
      });

      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thực đơn tuần 39',
          status: 'DRAFT',
          version: 1,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('createVersion', () => {
    it('should clone menu into next version (v2.0)', async () => {
      jest.spyOn(service, 'getVersions').mockResolvedValue([{ ...mockMenu, version: 1 } as Menu]);

      const result = await service.createVersion(mockTenantId, mockUserId, mockMenu.id!);
      expect(menuRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
          parentMenuId: mockMenu.id,
          status: 'DRAFT',
        }),
      );
    });
  });

  describe('adjustDish', () => {
    it('should add or update dish in menu slot', async () => {
      const adjusted = await service.adjustDish(mockTenantId, mockMenu.id!, {
        dayOfWeek: 1,
        mealTime: 'LUNCH',
        dishId: mockDish.id!,
        portionSizeG: 120,
      });

      expect(menuDishRepo.create).toHaveBeenCalled();
      expect(menuDishRepo.save).toHaveBeenCalled();
    });
  });

  describe('Workflow: submit, approve, reject, publish', () => {
    it('should submit draft menu for review', async () => {
      const menu = await service.submitForReview(mockTenantId, mockMenu.id!);
      expect(menu.status).toBe('SUBMITTED_FOR_REVIEW');
    });

    it('should approve submitted menu by principal', async () => {
      currentMenuState.status = 'SUBMITTED_FOR_REVIEW';

      const approved = await service.approve(mockTenantId, mockUserId, mockMenu.id!, {
        approvalNotes: 'Đồng ý duyệt áp dụng tuần này.',
      });

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe(mockUserId);
    });

    it('should reject submitted menu by principal with reason', async () => {
      currentMenuState.status = 'SUBMITTED_FOR_REVIEW';

      const rejected = await service.reject(mockTenantId, mockUserId, mockMenu.id!, {
        rejectionReason: 'Thiếu món rau xanh cho ngày thứ 4.',
      });

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('Thiếu món rau xanh cho ngày thứ 4.');
    });

    it('should publish approved menu and lock it', async () => {
      currentMenuState.status = 'APPROVED';

      const published = await service.publish(mockTenantId, mockUserId, mockMenu.id!);
      expect(published.status).toBe('ACTIVE');
      expect(published.isPublished).toBe(true);
    });
  });

  describe('Soft Delete & Restore', () => {
    it('should soft delete menu by setting deletedAt timestamp', async () => {
      const success = await service.softDelete(mockTenantId, mockMenu.id!);
      expect(success).toBe(true);
      expect(menuRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should restore soft deleted menu', async () => {
      menuRepo.findOne.mockResolvedValueOnce({
        ...mockMenu,
        deletedAt: new Date(),
      });

      const restored = await service.restore(mockTenantId, mockMenu.id!);
      expect(restored.deletedAt).toBeNull();
    });
  });

  describe('Import Excel', () => {
    it('should parse excel items and create menu with dishes', async () => {
      const imported = await service.importExcel(mockTenantId, mockUserId, {
        title: 'Thực đơn Import Excel Tuần 40',
        startDate: '2026-10-05',
        endDate: '2026-10-09',
        targetAgeGroup: 'ALL_AGES',
        items: [
          { dayOfWeek: 1, mealTime: 'LUNCH', dishName: 'Cơm trắng gạo dẻo', portionSizeG: 100 },
          { dayOfWeek: 1, mealTime: 'LUNCH', dishName: 'Thịt kho trứng cút', portionSizeG: 60 },
        ],
      });

      expect(menuRepo.create).toHaveBeenCalled();
      expect(menuDishRepo.save).toHaveBeenCalled();
    });
  });
});
