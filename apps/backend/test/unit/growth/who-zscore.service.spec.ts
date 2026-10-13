import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WhoZscoreService } from '../../../src/modules/growth/services/who-zscore.service';
import { WhoGrowthStandard } from '../../../src/modules/growth/entities/who-growth-standard.entity';

describe('WhoZscoreService (WHO LMS Algorithm Unit Tests)', () => {
  let service: WhoZscoreService;
  let mockStandardRepo: any;

  beforeEach(async () => {
    mockStandardRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhoZscoreService,
        {
          provide: getRepositoryToken(WhoGrowthStandard),
          useValue: mockStandardRepo,
        },
      ],
    }).compile();

    service = module.get<WhoZscoreService>(WhoZscoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('WHO LMS Z-Score Computation', () => {
    it('should compute normal Z-scores for a healthy 36-month-old boy', () => {
      // Median for 36-month boy: Weight ~14.34kg, Height ~96.14cm, BMI ~15.5
      const res = service.calculateSync('MALE', 36, 14.34, 96.14, 15.5);
      expect(res.waz).toBeCloseTo(0, 1);
      expect(res.haz).toBeCloseTo(0, 1);
      expect(res.baz).toBeCloseTo(0, 1);
      expect(res.classification).toBe('NORMAL');
    });

    it('should detect STUNTED status when HAZ is below -2 SD', () => {
      // 36-month boy with height 86cm (severely below median 96.14cm) and normal BMI
      const res = service.calculateSync('MALE', 36, 14.34, 86.0, 15.5);
      expect(res.haz).toBeLessThan(-2.0);
      expect(res.classification).toBe('STUNTED');
    });

    it('should detect UNDERWEIGHT status when WAZ or BAZ is below -2 SD', () => {
      // 36-month boy with weight 10.5kg (significantly below median 14.34kg)
      const res = service.calculateSync('MALE', 36, 10.5, 96.14, 11.3);
      expect(res.waz).toBeLessThan(-2.0);
      expect(res.classification).toBe('UNDERWEIGHT');
    });

    it('should detect OVERWEIGHT / OBESE status when BAZ exceeds +2 SD', () => {
      // 48-month girl with high BMI ~20.7
      const res = service.calculateSync('FEMALE', 48, 22.0, 103.0, 20.7);
      expect(res.baz).toBeGreaterThan(2.0);
      expect(['OVERWEIGHT', 'OBESE']).toContain(res.classification);
    });

    it('should handle boundary ages and clamp safely within [0, 84] months', () => {
      const res = service.calculateSync('MALE', 0, 3.346, 49.88, 13.4);
      expect(res.waz).toBeCloseTo(0, 1);
      expect(res.haz).toBeCloseTo(0, 1);
    });
  });
});
