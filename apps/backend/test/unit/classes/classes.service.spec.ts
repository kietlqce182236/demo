import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClassesService } from '../../../src/modules/classes/classes.service';
import { ClassEntity } from '../../../src/modules/classes/entities/class.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';

describe('ClassesService (Unit Tests)', () => {
  let service: ClassesService;
  let mockClassRepo: any;
  let mockChildRepo: any;

  beforeEach(async () => {
    mockClassRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
      remove: jest.fn().mockResolvedValue(true),
    };

    mockChildRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: getRepositoryToken(ClassEntity), useValue: mockClassRepo },
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should query classes and enrich each with studentCount and allergy alerts', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, name: 'Lớp Mầm 1', ageGroup: 'MAM', schoolYear: '2025-2026', status: 'ACTIVE' },
        ]),
      };

      mockClassRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockChildRepo.find.mockResolvedValue([
        { id: 10, fullName: 'Bé A', allergies: [{ id: 1, allergenName: 'Hải sản' }] },
        { id: 11, fullName: 'Bé B', allergies: [] },
      ]);

      const result = await service.findAll({ search: 'Mầm', ageGroup: 'MAM' });

      expect(result).toHaveLength(1);
      expect(result[0].studentCount).toBe(2);
      expect(result[0].allergicCount).toBe(1);
      expect(result[0].hasAllergyAlert).toBe(true);
    });
  });

  describe('findOne()', () => {
    it('should throw NotFoundException if class not found', async () => {
      mockClassRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return class with student list when found', async () => {
      mockClassRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Lớp Chồi 1',
        ageGroup: 'CHOI',
        homeroomTeacher: { id: 5, fullName: 'Cô Lan' },
      });
      mockChildRepo.find.mockResolvedValue([
        { id: 21, fullName: 'Bé Linh', allergies: [] },
      ]);

      const result = await service.findOne(1);
      expect(result.name).toBe('Lớp Chồi 1');
      expect(result.studentCount).toBe(1);
      expect(result.students).toHaveLength(1);
    });
  });

  describe('create()', () => {
    it('should infer ageGroup and create class successfully', async () => {
      const dto = {
        name: 'Lớp Nhà Trẻ Cúc Vàng',
        gradeLevel: 'TODDLER_18_24',
        academicYear: '2025-2026',
        mainTeacherId: '12',
      };

      const result = await service.create(dto as any);
      expect(mockClassRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Lớp Nhà Trẻ Cúc Vàng',
          ageGroup: 'NHA_TRE',
          schoolYear: '2025-2026',
          homeroomTeacherId: 12,
        }),
      );
      expect(result.id).toBe(1);
    });
  });

  describe('update()', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      mockClassRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should update class properties and save', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Old Name', ageGroup: 'MAM' });

      const updated = await service.update(1, { name: 'Lớp Lá 2', ageGroup: 'LA' });
      expect(mockClassRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Lớp Lá 2', ageGroup: 'LA' }),
      );
      expect(updated.name).toBe('Lớp Lá 2');
    });
  });

  describe('remove()', () => {
    it('should delete existing class or throw error if missing', async () => {
      mockClassRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);

      mockClassRepo.findOne.mockResolvedValueOnce({ id: 1, name: 'Lớp X' });
      const res = await service.remove(1);
      expect(mockClassRepo.remove).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('addStudents() and removeStudent()', () => {
    it('should batch update classId for students in addStudents', async () => {
      const res = await service.addStudents(1, [10, 11, 12]);
      expect(mockChildRepo.update).toHaveBeenCalled();
      expect(res.count).toBe(3);
    });

    it('should detach classId in removeStudent', async () => {
      const mockChild = { id: 10, classId: 1 };
      mockChildRepo.findOne.mockResolvedValue(mockChild);

      const res = await service.removeStudent(1, 10);
      expect(mockChild.classId).toBeNull();
      expect(mockChildRepo.save).toHaveBeenCalledWith(mockChild);
      expect(res.success).toBe(true);
    });
  });
});
