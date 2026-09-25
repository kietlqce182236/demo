import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../../src/modules/tenant/services/tenant.service';
import { Tenant } from '../../../src/modules/auth/entities/tenant.entity';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepo: any;

  const mockTenant: Partial<Tenant> = {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'MN_SAOMAI',
    name: 'Trường Mầm Non Sao Mai',
    contactEmail: 'contact@saomai.edu.vn',
    phone: '(028) 3829 4999',
    address: '128 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    status: 'ACTIVE',
    subscriptionTier: 'STANDARD',
    maxChildren: 250,
    settings: {
      education_department_code: 'GD-MN-79-03-0042',
      school_identifier_sgd: 'MN-HCM-Q3-0042',
      food_safety_license: {
        number: '458/2023/ATTP-Q3',
        expiry_date: '2026-11-18',
      },
      legal_representative: {
        name: 'Nguyễn Thu Thủy',
        title: 'Hiệu trưởng',
      },
      branding: {
        logo_url: '/assets/logo_saomai_kids.svg',
        logo_name: 'logo_saomai_kids.svg',
        logo_size: '142 KB • 512×512px • Vector RGB',
        primary_color: 'TEAL',
      },
    },
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    tenantRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockTenant }),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantRepo,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('getTenantProfile', () => {
    it('trả về thông tin trường học đúng định dạng khi tìm thấy', async () => {
      const res = await service.getTenantProfile('a0000000-0000-0000-0000-000000000002');
      expect(res.name).toBe('Trường Mầm Non Sao Mai');
      expect(res.educationDepartmentCode).toBe('GD-MN-79-03-0042');
      expect(res.foodSafetyLicense.number).toBe('458/2023/ATTP-Q3');
      expect(res.branding.primaryColor).toBe('TEAL');
    });

    it('ném lỗi NotFoundException khi không tìm thấy trường', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getTenantProfile('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenantProfile', () => {
    it('cập nhật thành công địa chỉ, hotline và giấy phép ATTP', async () => {
      const res = await service.updateTenantProfile('a0000000-0000-0000-0000-000000000002', {
        address: '130 Võ Thị Sáu, Quận 3, TP.HCM',
        phone: '02838999888',
        foodSafetyLicense: {
          number: '999/2024/ATTP-Q3',
        },
      });

      expect(tenantRepo.save).toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('uploadLogo', () => {
    it('chấp nhận file logo hợp lệ (SVG <= 2MB)', async () => {
      const res = await service.uploadLogo('a0000000-0000-0000-0000-000000000002', {
        fileName: 'new_logo.svg',
        fileSizeBytes: 145000, // ~145 KB
        mimeType: 'image/svg+xml',
      });

      expect(res.message).toContain('thành công');
      expect(tenantRepo.save).toHaveBeenCalled();
    });

    it('từ chối và ném lỗi BadRequestException khi upload file BMP không hợp lệ', async () => {
      await expect(
        service.uploadLogo('a0000000-0000-0000-0000-000000000002', {
          fileName: 'banner_truong_hoc_2024.bmp',
          fileSizeBytes: 8400000, // 8.4 MB
          mimeType: 'image/bmp',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối và ném lỗi BadRequestException khi file vượt quá 2MB', async () => {
      await expect(
        service.uploadLogo('a0000000-0000-0000-0000-000000000002', {
          fileName: 'heavy_logo.png',
          fileSizeBytes: 3 * 1024 * 1024, // 3MB
          mimeType: 'image/png',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
