import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectionsService } from '../../../src/modules/inspections/inspections.service';
import { InspectionRecord } from '../../../src/modules/inspections/entities/inspection-record.entity';
import { InspectionSampleItem } from '../../../src/modules/inspections/entities/inspection-sample-item.entity';
import { InspectionImage } from '../../../src/modules/inspections/entities/inspection-image.entity';
import { KitchenGateway } from '../../../src/modules/websocket/kitchen.gateway';

describe('InspectionsService (Unit Tests)', () => {
  let service: InspectionsService;
  let mockInspectionRepo: any;
  let mockSampleRepo: any;
  let mockImageRepo: any;
  let mockKitchenGateway: any;

  beforeEach(async () => {
    mockInspectionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };

    mockSampleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };

    mockImageRepo = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };

    mockKitchenGateway = {
      broadcastSafetyAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        {
          provide: getRepositoryToken(InspectionRecord),
          useValue: mockInspectionRepo,
        },
        {
          provide: getRepositoryToken(InspectionSampleItem),
          useValue: mockSampleRepo,
        },
        {
          provide: getRepositoryToken(InspectionImage),
          useValue: mockImageRepo,
        },
        {
          provide: KitchenGateway,
          useValue: mockKitchenGateway,
        },
      ],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInspections()', () => {
    it('should aggregate 3 steps into consolidated sessions with Vietnamese status', async () => {
      mockInspectionRepo.find.mockResolvedValue([
        {
          id: 101,
          date: '2025-11-03',
          mealSession: 'LUNCH',
          sessionCode: 'BB-KT-20251103-01',
          inspectionStep: 'STEP_1_PRE_PROCESSING_CHECK',
          result: 'PASS',
          note: 'Nguyên liệu tươi sống',
          inspector: { fullName: 'Nguyễn Văn Cường' },
          images: [],
        },
        {
          id: 102,
          date: '2025-11-03',
          mealSession: 'LUNCH',
          sessionCode: 'BB-KT-20251103-01',
          inspectionStep: 'STEP_2_PROCESSING_CHECK',
          result: 'PASS',
          note: 'Bếp sạch sẽ, nhiệt độ sôi > 75C',
          inspector: { fullName: 'Nguyễn Văn Cường' },
          images: [],
        },
        {
          id: 103,
          date: '2025-11-03',
          mealSession: 'LUNCH',
          sessionCode: 'BB-KT-20251103-01',
          inspectionStep: 'STEP_3_PRE_SERVING_CHECK',
          result: 'PASS',
          note: 'Thử nếm cảm quan đạt chuẩn',
          inspector: { fullName: 'Nguyễn Văn Cường' },
          images: [],
        },
      ]);

      mockSampleRepo.find.mockResolvedValue([
        {
          id: 1,
          date: '2025-11-03',
          sampleCode: 'LM-20251103-01',
          dishName: 'Thịt kho trứng',
          sampleWeightG: 150,
          storageTemp: 3.8,
          status: 'STORED',
          storedAt: new Date('2025-11-03T10:45:00.000Z'),
          collectorName: 'Nguyễn Văn Cường (Bếp trưởng)',
        },
      ]);

      const result = await service.getInspections();
      expect(result).toHaveLength(1);
      const session = result[0];
      expect(session.code).toBe('BB-KT-20251103-01');
      expect(session.status).toBe('Hoàn tất');
      expect(session.step1Status).toBe('Đạt chuẩn');
      expect(session.step2Status).toBe('Đạt chuẩn');
      expect(session.step3Status).toBe('Đạt chuẩn');
      expect(session.sampleItems).toHaveLength(1);
      expect(session.sampleItems[0].dishName).toBe('Thịt kho trứng');
    });

    it('should assign "Có cảnh báo" status when any step has result FAIL', async () => {
      mockInspectionRepo.find.mockResolvedValue([
        {
          id: 101,
          date: '2025-11-04',
          mealSession: 'LUNCH',
          inspectionStep: 'STEP_1_PRE_PROCESSING_CHECK',
          result: 'FAIL',
          note: 'Rau dập nát',
          inspector: { fullName: 'Nguyễn Văn Cường' },
          images: [],
        },
      ]);
      mockSampleRepo.find.mockResolvedValue([]);

      const result = await service.getInspections();
      expect(result[0].status).toBe('Có cảnh báo');
    });
  });

  describe('createStep1()', () => {
    it('should save step 1 inspection record and optional image', async () => {
      const body = {
        mealDate: '2026-10-12',
        mealTime: 'Trưa chính (10:30)',
        note: 'Tiếp nhận nguyên liệu đạt chuẩn',
        photoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const result = await service.createStep1(body, 3);
      expect(mockInspectionRepo.create).toHaveBeenCalled();
      expect(mockInspectionRepo.save).toHaveBeenCalled();
      expect(mockImageRepo.create).toHaveBeenCalled();
      expect(result).toHaveProperty('recordId');
      expect(result.success).toBe(true);
    });
  });

  describe('getSamples() & disposeSample()', () => {
    it('should return sample items with calculated countdown hours', async () => {
      const now = new Date();
      const storedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      mockSampleRepo.find.mockResolvedValue([
        {
          id: 1,
          sampleCode: 'HD-LM-01',
          dishName: 'Canh bí đỏ',
          date: '2026-10-12',
          storedAt,
          status: 'STORED',
          sampleWeightG: 150,
          storageTemp: 3.5,
          fridgeUnit: 'Tủ lưu số 1',
          collectorName: 'Nguyễn Văn Cường',
        },
      ]);

      const samples = await service.getSamples();
      expect(samples).toHaveLength(1);
      expect(samples[0].countdownHours).toBeGreaterThan(21);
      expect(samples[0].countdownHours).toBeLessThanOrEqual(22.1);
      expect(samples[0].status).toBe('STORED');
    });

    it('should mark sample as DISPOSED when disposing', async () => {
      const sample = {
        id: 1,
        status: 'STORED',
        disposeAt: null,
      };
      mockSampleRepo.findOne.mockResolvedValue(sample);

      const res = await service.disposeSample(1);
      expect(sample.status).toBe('DISPOSED');
      expect(mockSampleRepo.save).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('Collaborative Inspection Workflow (Nutritionist & Kitchen Staff)', () => {
    it('createSessionByNutritionist() should create a session awaiting kitchen photos', async () => {
      mockInspectionRepo.find.mockResolvedValue([]);
      mockSampleRepo.find.mockResolvedValue([]);

      const result = await service.createSessionByNutritionist(
        {
          mealSession: 'LUNCH',
          inspectionDate: '2026-10-12',
          dishes: ['Thịt kho trứng', 'Canh rau ngót'],
          nutritionistNotes: 'Yêu cầu chụp rõ tem mác thịt',
        },
        3,
      );

      expect(result.success).toBe(true);
      expect(result.approvalStatus).toBe('CHO_BEP_TAI_ANH');
      expect(result.dishes).toContain('Thịt kho trứng');
      expect(mockKitchenGateway.broadcastSafetyAlert).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'INSPECTION_SESSION_CREATED',
        }),
      );
    });

    it('kitchenSubmitPhotos() should transition session to CHO_DUYET and save photo evidence', async () => {
      const mockSession = {
        id: 1,
        date: '2026-10-12',
        sessionCode: 'BB-KT-20261012-01',
        mealSession: 'LUNCH',
        inspectionStep: 'STEP_1_RAW_CHECK',
        note: '__WORKFLOW__:{"approvalStatus":"CHO_BEP_TAI_ANH","dishes":["Cơm"]}:__END__ Ghi chú',
      };
      mockInspectionRepo.find.mockResolvedValue([mockSession]);
      mockSampleRepo.find.mockResolvedValue([]);

      const result = await service.kitchenSubmitPhotos(
        'BB-KT-20261012-01',
        {
          step1Photos: ['https://example.com/step1.jpg'],
          step2Photos: ['https://example.com/step2.jpg'],
          step3Photos: ['https://example.com/step3.jpg'],
          step2Temperature: 92,
          step3Temperature: 4.0,
          dishes: ['Cơm', 'Canh gà'],
        },
        5,
      );

      expect(result.success).toBe(true);
      expect(result.approvalStatus).toBe('CHO_DUYET');
      expect(mockImageRepo.save).toHaveBeenCalled();
      expect(mockKitchenGateway.broadcastSafetyAlert).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'INSPECTION_SUBMITTED_FOR_APPROVAL',
        }),
      );
    });

    it('approveInspection() should transition status to DA_DUYET', async () => {
      const mockSession = {
        id: 1,
        date: '2026-10-12',
        sessionCode: 'BB-KT-20261012-01',
        mealSession: 'LUNCH',
        inspectionStep: 'STEP_1_RAW_CHECK',
        note: '__WORKFLOW__:{"approvalStatus":"CHO_DUYET"}:__END__',
      };
      mockInspectionRepo.find.mockResolvedValue([mockSession]);
      mockSampleRepo.find.mockResolvedValue([]);

      const result = await service.approveInspection('BB-KT-20261012-01', {}, 3);

      expect(result.success).toBe(true);
      expect(result.approvalStatus).toBe('DA_DUYET');
      expect(mockKitchenGateway.broadcastSafetyAlert).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'INSPECTION_APPROVED',
        }),
      );
    });

    it('rejectInspection() should transition status to YEU_CAU_CHUP_LAI with rejection reason', async () => {
      const mockSession = {
        id: 1,
        date: '2026-10-12',
        sessionCode: 'BB-KT-20261012-01',
        mealSession: 'LUNCH',
        inspectionStep: 'STEP_1_RAW_CHECK',
        note: '__WORKFLOW__:{"approvalStatus":"CHO_DUYET"}:__END__',
      };
      mockInspectionRepo.find.mockResolvedValue([mockSession]);
      mockSampleRepo.find.mockResolvedValue([]);

      const result = await service.rejectInspection(
        'BB-KT-20261012-01',
        { rejectionReason: 'Ảnh bước 2 bị mờ, hãy chụp lại đồng hồ nhiệt độ' },
        3,
      );

      expect(result.success).toBe(true);
      expect(result.approvalStatus).toBe('YEU_CAU_CHUP_LAI');
      expect(result.rejectionReason).toBe('Ảnh bước 2 bị mờ, hãy chụp lại đồng hồ nhiệt độ');
      expect(mockKitchenGateway.broadcastSafetyAlert).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'INSPECTION_REJECTED_RETAKE',
        }),
      );
    });
  });
});
