import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementController } from '../../../src/modules/users/controllers/staff-management.controller';
import { StaffManagementService } from '../../../src/modules/users/services/staff-management.service';

describe('StaffManagementController', () => {
  let controller: StaffManagementController;
  let serviceMock: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockUserId = 'user-uuid-1';
  const mockTargetId = 'user-uuid-2';

  beforeEach(async () => {
    serviceMock = {
      getStaffList: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getStaffStats: jest.fn().mockResolvedValue({ totalStaff: 5, activeStaff: 5 }),
      getAvailableStaffRoles: jest.fn().mockResolvedValue([{ code: 'TEACHER', name: 'Giáo Viên' }]),
      getStaffById: jest.fn().mockResolvedValue({ id: mockTargetId, fullName: 'Cô Lan' }),
      createStaff: jest.fn().mockResolvedValue({ id: 'new-id', email: 'test@saomai.edu.vn' }),
      updateStaff: jest.fn().mockResolvedValue({ id: mockTargetId, fullName: 'Cô Lan Cập Nhật' }),
      softDeleteStaff: jest.fn().mockResolvedValue({ success: true }),
      restoreStaff: jest.fn().mockResolvedValue({ success: true }),
      toggleStaffStatus: jest.fn().mockResolvedValue({ success: true, status: 'INACTIVE' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffManagementController],
      providers: [
        { provide: StaffManagementService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<StaffManagementController>(StaffManagementController);
  });

  it('phải gọi getStaffList từ service', async () => {
    const query = { page: 1, limit: 10 };
    await controller.getStaffList(mockTenantId, query);
    expect(serviceMock.getStaffList).toHaveBeenCalledWith(mockTenantId, query);
  });

  it('phải gọi getStaffStats từ service', async () => {
    await controller.getStaffStats(mockTenantId);
    expect(serviceMock.getStaffStats).toHaveBeenCalledWith(mockTenantId);
  });

  it('phải gọi getAvailableStaffRoles từ service', async () => {
    await controller.getAvailableStaffRoles();
    expect(serviceMock.getAvailableStaffRoles).toHaveBeenCalled();
  });

  it('phải gọi createStaff từ service', async () => {
    const dto = {
      email: 'teacher@saomai.edu.vn',
      fullName: 'Cô Mai',
      roleCodes: ['TEACHER'],
    };
    await controller.createStaff(mockTenantId, dto);
    expect(serviceMock.createStaff).toHaveBeenCalledWith(mockTenantId, dto);
  });

  it('phải gọi updateStaff từ service', async () => {
    const dto = { fullName: 'Cô Mai Cập Nhật' };
    await controller.updateStaff(mockTenantId, mockTargetId, dto);
    expect(serviceMock.updateStaff).toHaveBeenCalledWith(mockTenantId, mockTargetId, dto);
  });

  it('phải gọi softDeleteStaff từ service', async () => {
    await controller.softDeleteStaff(mockTenantId, mockUserId, mockTargetId);
    expect(serviceMock.softDeleteStaff).toHaveBeenCalledWith(mockTenantId, mockUserId, mockTargetId);
  });

  it('phải gọi restoreStaff từ service', async () => {
    await controller.restoreStaff(mockTenantId, mockTargetId);
    expect(serviceMock.restoreStaff).toHaveBeenCalledWith(mockTenantId, mockTargetId);
  });

  it('phải gọi toggleStaffStatus từ service', async () => {
    await controller.toggleStaffStatus(mockTenantId, mockUserId, mockTargetId);
    expect(serviceMock.toggleStaffStatus).toHaveBeenCalledWith(mockTenantId, mockUserId, mockTargetId);
  });
});
