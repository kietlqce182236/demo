import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { StaffManagementService } from '../../../src/modules/users/services/staff-management.service';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Role } from '../../../src/modules/auth/entities/role.entity';

describe('StaffManagementService', () => {
  let service: StaffManagementService;
  let userRepoMock: any;
  let roleRepoMock: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockUserId = 'user-uuid-1';
  const mockTargetId = 'user-uuid-2';

  const mockStaffRole: Role = {
    id: 'role-teacher-id',
    code: 'TEACHER',
    name: 'Giáo Viên',
    description: 'Giáo viên',
    isSystem: true,
    tenantId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: Partial<User> = {
    id: mockTargetId,
    tenantId: mockTenantId,
    email: 'giaovien@hoamai.edu.vn',
    fullName: 'Cô Nguyễn Thị Hoa',
    phone: '0903111222',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    roles: [mockStaffRole],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    userRepoMock = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((u) => Promise.resolve({ id: 'new-id', ...u })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      restore: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    roleRepoMock = {
      find: jest.fn().mockResolvedValue([mockStaffRole]),
      findOne: jest.fn().mockResolvedValue(mockStaffRole),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffManagementService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Role), useValue: roleRepoMock },
      ],
    }).compile();

    service = module.get<StaffManagementService>(StaffManagementService);
  });

  describe('getStaffList', () => {
    it('phải trả về danh sách nhân sự phân trang thành công', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        withDeleted: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getStaffList(mockTenantId, {
        page: 1,
        limit: 10,
        search: 'Hoa',
        roleCode: 'TEACHER',
        status: 'ACTIVE',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('giaovien@hoamai.edu.vn');
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(qbMock.leftJoinAndSelect).toHaveBeenCalledWith('u.roles', 'r');
    });
  });

  describe('getStaffById', () => {
    it('phải trả về chi tiết nhân sự khi tìm thấy', async () => {
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getStaffById(mockTenantId, mockTargetId);

      expect(result.id).toBe(mockTargetId);
      expect(result.fullName).toBe('Cô Nguyễn Thị Hoa');
    });

    it('phải ném NotFoundException khi không tìm thấy nhân sự', async () => {
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.getStaffById(mockTenantId, 'unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createStaff', () => {
    it('phải tạo nhân sự mới thành công và hash mật khẩu', async () => {
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // Email chưa tồn tại
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.createStaff(mockTenantId, {
        email: 'newteacher@hoamai.edu.vn',
        fullName: 'Thầy Trần Văn Minh',
        phone: '0909888777',
        roleCodes: ['TEACHER'],
        password: 'Password123@',
      });

      expect(result.email).toBe('newteacher@hoamai.edu.vn');
      expect(userRepoMock.create).toHaveBeenCalled();
      expect(userRepoMock.save).toHaveBeenCalled();
    });

    it('phải ném ConflictException khi email đã tồn tại', async () => {
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        service.createStaff(mockTenantId, {
          email: 'giaovien@hoamai.edu.vn',
          fullName: 'Trùng Email',
          roleCodes: ['TEACHER'],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDeleteStaff', () => {
    it('phải từ chối xóa chính tài khoản đang đăng nhập', async () => {
      await expect(
        service.softDeleteStaff(mockTenantId, mockUserId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('phải thực hiện xóa mềm TypeORM và đổi status thành INACTIVE', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.softDeleteStaff(mockTenantId, mockUserId, mockTargetId);

      expect(result.success).toBe(true);
      expect(userRepoMock.softDelete).toHaveBeenCalledWith({
        id: mockTargetId,
        tenantId: mockTenantId,
      });
      expect(userRepoMock.update).toHaveBeenCalledWith(
        { id: mockTargetId, tenantId: mockTenantId },
        { status: 'INACTIVE' },
      );
    });

    it('phải từ chối xóa tài khoản SUPER_ADMIN', async () => {
      const superAdminUser = {
        ...mockUser,
        roles: [{ code: 'SUPER_ADMIN', name: 'Quản trị viên' }],
      };
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(superAdminUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        service.softDeleteStaff(mockTenantId, mockUserId, mockTargetId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restoreStaff', () => {
    it('phải khôi phục tài khoản đã xóa mềm và đặt lại status ACTIVE', async () => {
      const deletedUser = {
        ...mockUser,
        deletedAt: new Date(),
      };
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(deletedUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.restoreStaff(mockTenantId, mockTargetId);

      expect(result.success).toBe(true);
      expect(userRepoMock.restore).toHaveBeenCalledWith({
        id: mockTargetId,
        tenantId: mockTenantId,
      });
      expect(userRepoMock.update).toHaveBeenCalledWith(
        { id: mockTargetId, tenantId: mockTenantId },
        { status: 'ACTIVE' },
      );
    });

    it('phải ném BadRequestException nếu tài khoản không ở trạng thái xóa mềm', async () => {
      const activeUser = {
        ...mockUser,
        deletedAt: null,
      };
      const qbMock: any = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(activeUser),
      };
      userRepoMock.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.restoreStaff(mockTenantId, mockTargetId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('toggleStaffStatus', () => {
    it('phải đảo ngược trạng thái tài khoản giữa ACTIVE và INACTIVE', async () => {
      userRepoMock.findOne.mockResolvedValue({ ...mockUser, status: 'ACTIVE' });

      const result = await service.toggleStaffStatus(mockTenantId, mockUserId, mockTargetId);

      expect(result.status).toBe('INACTIVE');
      expect(userRepoMock.update).toHaveBeenCalledWith(
        { id: mockTargetId, tenantId: mockTenantId },
        { status: 'INACTIVE' },
      );
    });
  });
});
