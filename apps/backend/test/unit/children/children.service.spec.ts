import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ChildrenService } from '../../../src/modules/children/services/children.service';
import { Child } from '../../../src/modules/children/entities/child.entity';
import { ChildAllergy } from '../../../src/modules/children/entities/child-allergy.entity';
import { AllergenCatalog } from '../../../src/modules/children/entities/allergen-catalog.entity';

describe('ChildrenService (Unit Tests)', () => {
  let service: ChildrenService;
  let mockChildRepo: any;
  let mockAllergyRepo: any;
  let mockCatalogRepo: any;

  beforeEach(async () => {
    mockChildRepo = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    };

    mockAllergyRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 10 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 10 })),
      findOne: jest.fn(),
    };

    mockCatalogRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
        { provide: getRepositoryToken(ChildAllergy), useValue: mockAllergyRepo },
        { provide: getRepositoryToken(AllergenCatalog), useValue: mockCatalogRepo },
      ],
    }).compile();

    service = module.get<ChildrenService>(ChildrenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should query children with relations and map them to ChildItem structure', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 1,
              studentCode: 'HS-001',
              fullName: 'Nguyễn Văn An',
              dateOfBirth: '2021-05-10',
              gender: 'MALE',
              status: 'ACTIVE',
              class: { name: 'Lớp Mầm 1', ageGroup: 'MAM' },
              allergies: [
                {
                  id: 101,
                  allergenId: 1,
                  severity: 'SEVERE',
                  note: 'Dị ứng nặng',
                  allergen: { name: 'Đậu phộng', code: 'PEANUT' },
                  declaredAt: new Date('2026-01-01'),
                },
              ],
            },
          ],
          1,
        ]),
      };

      mockChildRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ search: 'An', allergyRisk: 'YES', page: 1, limit: 10 });

      expect(mockChildRepo.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].fullName).toBe('Nguyễn Văn An');
      expect(result.items[0].hasAllergy).toBe(true);
      expect(result.items[0].allergies[0].allergenName).toBe('Đậu phộng');
      expect(result.items[0].allergies[0].severity).toBe('SEVERE');
    });
  });

  describe('getStats()', () => {
    it('should aggregate gender counts, allergy numbers, and calculate allergy rate', async () => {
      mockChildRepo.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(28) // boys
        .mockResolvedValueOnce(22); // girls

      const mockQbAllergies = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
      };

      const mockQbSevere = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '2' }),
      };

      mockChildRepo.createQueryBuilder
        .mockReturnValueOnce(mockQbAllergies)
        .mockReturnValueOnce(mockQbSevere);

      const stats = await service.getStats();

      expect(stats.totalChildren).toBe(50);
      expect(stats.boysCount).toBe(28);
      expect(stats.girlsCount).toBe(22);
      expect(stats.allergicCount).toBe(5);
      expect(stats.severeCount).toBe(2);
      expect(stats.allergyRate).toBe(10); // 5 / 50 * 100 = 10%
      expect(stats.normalDietCount).toBe(45);
    });
  });

  describe('findOne()', () => {
    it('should throw NotFoundException if child does not exist', async () => {
      mockChildRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return child with mapped allergies when found', async () => {
      mockChildRepo.findOne.mockResolvedValue({
        id: 1,
        studentCode: 'HS-001',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: '2021-05-10',
        gender: 'MALE',
        classId: 2,
        class: { name: 'Lớp Chồi 1' },
        status: 'ACTIVE',
        allergies: [],
      });

      const child = await service.findOne(1);
      expect(child.id).toBe('1');
      expect(child.fullName).toBe('Nguyễn Văn An');
      expect(child.className).toBe('Lớp Chồi 1');
      expect(child.allergies).toEqual([]);
    });
  });

  describe('create()', () => {
    it('should create and persist a new child and return findOne', async () => {
      const dto = {
        fullName: 'Lê Minh Khang',
        dateOfBirth: '2022-03-15',
        gender: 'MALE',
        classId: 3,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: '1',
        studentCode: 'HS-123456',
        fullName: 'Lê Minh Khang',
        dateOfBirth: '2022-03-15',
        gender: 'MALE',
        avatarUrl: null,
        classId: '3',
        className: 'Lớp Mầm 2',
        status: 'ACTIVE',
        allergies: [],
      });

      const result = await service.create(dto);

      expect(mockChildRepo.create).toHaveBeenCalled();
      expect(mockChildRepo.save).toHaveBeenCalled();
      expect(result.fullName).toBe('Lê Minh Khang');
    });
  });

  describe('declareAllergy()', () => {
    it('should throw NotFoundException if child not found', async () => {
      mockChildRepo.findOne.mockResolvedValue(null);

      await expect(
        service.declareAllergy(999, { allergenId: 1, severity: 'MILD' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should persist allergy and return formatted declaration', async () => {
      mockChildRepo.findOne.mockResolvedValue({ id: 1, fullName: 'Nguyễn Văn An' });
      mockAllergyRepo.save.mockResolvedValue({ id: 10, allergenId: 2, severity: 'SEVERE' });
      mockAllergyRepo.findOne.mockResolvedValue({
        id: 10,
        allergenId: 2,
        severity: 'SEVERE',
        note: 'Dị ứng tôm cua',
        declaredAt: new Date('2026-02-01'),
        allergen: { name: 'Hải sản', code: 'SEAFOOD' },
      });

      const result = await service.declareAllergy(1, {
        allergenId: 2,
        severity: 'SEVERE',
        note: 'Dị ứng tôm cua',
      });

      expect(mockAllergyRepo.create).toHaveBeenCalled();
      expect(mockAllergyRepo.save).toHaveBeenCalled();
      expect(result.allergenName).toBe('Hải sản');
      expect(result.severity).toBe('SEVERE');
      expect(result.note).toBe('Dị ứng tôm cua');
    });
  });
});
