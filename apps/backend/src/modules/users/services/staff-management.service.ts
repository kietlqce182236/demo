import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';
import { QueryStaffDto } from '../dto/staff/query-staff.dto';

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  teachers: number;
  kitchenAndNutrition: number;
  medicalStaff: number;
  inactiveOrDeleted: number;
}

@Injectable()
export class StaffManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  /**
   * Lấy danh sách nhân sự của cơ sở trường mầm non theo tenantId.
   * Hỗ trợ tìm kiếm, lọc theo vai trò, trạng thái, phân trang và xem nhân sự đã xóa mềm.
   */
  async getStaffList(tenantId: string, query: QueryStaffDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId });

    // Hỗ trợ truy vấn tài khoản đã xóa mềm
    if (query.includeDeleted) {
      qb.withDeleted();
    }

    // Tìm kiếm thời gian thực theo họ tên, email hoặc số điện thoại
    if (query.search && query.search.trim() !== '') {
      const searchPattern = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.fullName) LIKE :search OR LOWER(u.email) LIKE :search OR u.phone LIKE :search)',
        { search: searchPattern },
      );
    }

    // Lọc theo vai trò chuyên môn
    if (query.roleCode && query.roleCode.trim() !== '') {
      qb.andWhere('r.code = :roleCode', { roleCode: query.roleCode.trim() });
    } else {
      // Mặc định phân hệ nhân sự chỉ hiển thị cán bộ nhân viên, loại trừ PHỤ HUYNH thuần túy
      // (Nếu user chỉ có role PARENT thì không xuất hiện ở bảng nhân sự)
      qb.andWhere((subQb) => {
        const subQuery = subQb
          .subQuery()
          .select('ur_filter.user_id')
          .from('user_roles', 'ur_filter')
          .innerJoin('roles', 'r_filter', 'ur_filter.role_id = r_filter.id')
          .where("r_filter.code IN ('SUPER_ADMIN', 'PRINCIPAL', 'NUTRITIONIST', 'KITCHEN_MANAGER', 'TEACHER', 'MEDICAL_STAFF')")
          .getQuery();
        return `u.id IN ${subQuery}`;
      });
    }

    // Lọc theo trạng thái
    if (query.status && query.status.trim() !== '') {
      if (query.status === 'DELETED') {
        qb.andWhere('u.deletedAt IS NOT NULL');
      } else {
        qb.andWhere('u.status = :status', { status: query.status.trim() });
      }
    }

    // Sắp xếp
    const validSortFields = ['fullName', 'email', 'createdAt', 'lastLoginAt'];
    const sortBy = validSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`u.${sortBy}`, sortOrder);

    qb.skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    // Map dữ liệu trả về an toàn, loại bỏ trường bảo mật
    const staffList = users.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      status: u.status,
      twoFactorEnabled: u.twoFactorEnabled,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
      isDeleted: u.deletedAt !== null,
      roles: (u.roles || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
    }));

    return {
      data: staffList,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Thống kê các chỉ số nhân sự (KPI Cards trên đầu trang).
   */
  async getStaffStats(tenantId: string): Promise<StaffStats> {
    // 1. Tổng nhân sự đang hoạt động & tạm khóa (chưa xóa mềm)
    const activeStaffCount = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code IN ('SUPER_ADMIN', 'PRINCIPAL', 'NUTRITIONIST', 'KITCHEN_MANAGER', 'TEACHER', 'MEDICAL_STAFF')")
      .andWhere("u.status = 'ACTIVE'")
      .getCount();

    // 2. Giáo viên chủ nhiệm
    const teachersCount = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code = 'TEACHER'")
      .andWhere("u.status = 'ACTIVE'")
      .getCount();

    // 3. Nhân sự Bếp & Chuyên viên dinh dưỡng
    const kitchenAndNutritionCount = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code IN ('KITCHEN_MANAGER', 'NUTRITIONIST')")
      .andWhere("u.status = 'ACTIVE'")
      .getCount();

    // 4. Cán bộ y tế học đường
    const medicalStaffCount = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code = 'MEDICAL_STAFF'")
      .andWhere("u.status = 'ACTIVE'")
      .getCount();

    // 5. Tạm khóa hoặc đã xóa mềm (nghỉ việc / lưu trữ)
    const inactiveOrDeletedCount = await this.userRepo
      .createQueryBuilder('u')
      .withDeleted()
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code IN ('SUPER_ADMIN', 'PRINCIPAL', 'NUTRITIONIST', 'KITCHEN_MANAGER', 'TEACHER', 'MEDICAL_STAFF')")
      .andWhere("(u.status != 'ACTIVE' OR u.deletedAt IS NOT NULL)")
      .getCount();

    const totalStaff = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere("r.code IN ('SUPER_ADMIN', 'PRINCIPAL', 'NUTRITIONIST', 'KITCHEN_MANAGER', 'TEACHER', 'MEDICAL_STAFF')")
      .getCount();

    return {
      totalStaff,
      activeStaff: activeStaffCount,
      teachers: teachersCount,
      kitchenAndNutrition: kitchenAndNutritionCount,
      medicalStaff: medicalStaffCount,
      inactiveOrDeleted: inactiveOrDeletedCount,
    };
  }

  /**
   * Lấy danh sách các vai trò nhân sự trong trường học.
   */
  async getAvailableStaffRoles() {
    const staffCodes = ['PRINCIPAL', 'NUTRITIONIST', 'KITCHEN_MANAGER', 'TEACHER', 'MEDICAL_STAFF'];
    return this.roleRepo.find({
      where: { code: In(staffCodes) },
      select: ['id', 'code', 'name', 'description'],
      order: { code: 'ASC' },
    });
  }

  /**
   * Lấy chi tiết 1 nhân sự theo ID.
   */
  async getStaffById(tenantId: string, id: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .withDeleted()
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.id = :id AND u.tenantId = :tenantId', { id, tenantId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự này trong trường.');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      isDeleted: user.deletedAt !== null,
      roles: (user.roles || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
    };
  }

  /**
   * Tạo mới tài khoản nhân sự và gán vai trò.
   */
  async createStaff(tenantId: string, createDto: CreateStaffDto) {
    const email = createDto.email.trim().toLowerCase();

    // 1. Kiểm tra email đã tồn tại trong tenant chưa (kể cả đã xóa mềm)
    const existingUser = await this.userRepo
      .createQueryBuilder('u')
      .withDeleted()
      .where('LOWER(u.email) = :email AND u.tenantId = :tenantId', { email, tenantId })
      .getOne();

    if (existingUser) {
      if (existingUser.deletedAt !== null) {
        throw new ConflictException(
          'Email này thuộc về một tài khoản đã bị xóa mềm trước đó. Bạn có thể khôi phục tài khoản này thay vì tạo mới.',
        );
      }
      throw new ConflictException('Email này đã được sử dụng bởi một tài khoản khác trong trường.');
    }

    // 2. Kiểm tra danh sách vai trò
    const roles = await this.roleRepo.find({
      where: { code: In(createDto.roleCodes) },
    });

    if (!roles || roles.length === 0) {
      throw new BadRequestException('Vai trò được chọn không hợp lệ.');
    }

    // 3. Hash mật khẩu bằng bcryptjs (12 rounds)
    const rawPassword = createDto.password && createDto.password.trim() !== ''
      ? createDto.password.trim()
      : 'Password123@';
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    // 4. Tạo đối tượng User và lưu
    const newUser = this.userRepo.create({
      tenantId,
      email,
      fullName: createDto.fullName.trim(),
      phone: createDto.phone ? createDto.phone.trim() : null,
      passwordHash,
      status: createDto.status || 'ACTIVE',
      roles,
    });

    const savedUser = await this.userRepo.save(newUser);

    return {
      id: savedUser.id,
      tenantId: savedUser.tenantId,
      email: savedUser.email,
      fullName: savedUser.fullName,
      phone: savedUser.phone,
      status: savedUser.status,
      createdAt: savedUser.createdAt,
      roles: savedUser.roles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
      initialPassword: rawPassword, // Trả về để client có thể hiển thị cho BGH sao chép
    };
  }

  /**
   * Cập nhật thông tin và vai trò nhân sự.
   */
  async updateStaff(tenantId: string, id: string, updateDto: UpdateStaffDto) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.id = :id AND u.tenantId = :tenantId', { id, tenantId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự cần cập nhật.');
    }

    // Cập nhật thông tin cơ bản
    if (updateDto.fullName !== undefined) {
      user.fullName = updateDto.fullName.trim();
    }
    if (updateDto.phone !== undefined) {
      user.phone = updateDto.phone ? updateDto.phone.trim() : null;
    }
    if (updateDto.status !== undefined) {
      user.status = updateDto.status;
    }

    // Đặt lại mật khẩu mới nếu có
    if (updateDto.newPassword && updateDto.newPassword.trim() !== '') {
      user.passwordHash = await bcrypt.hash(updateDto.newPassword.trim(), 12);
    }

    // Cập nhật danh sách vai trò nếu có
    if (updateDto.roleCodes && updateDto.roleCodes.length > 0) {
      const roles = await this.roleRepo.find({
        where: { code: In(updateDto.roleCodes) },
      });
      if (roles.length > 0) {
        user.roles = roles;
      }
    }

    const updatedUser = await this.userRepo.save(user);

    return {
      id: updatedUser.id,
      tenantId: updatedUser.tenantId,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt,
      roles: (updatedUser.roles || []).map((r) => ({ id: r.id, code: r.code, name: r.name })),
    };
  }

  /**
   * XÓA MỀM (Soft Delete) tài khoản nhân sự:
   * - Cập nhật deleted_at = CURRENT_TIMESTAMP
   * - Đổi status = 'INACTIVE'
   * - TUYỆT ĐỐI KHÔNG XÓA CỨNG trong database.
   */
  async softDeleteStaff(tenantId: string, currentUserId: string, targetId: string) {
    if (currentUserId === targetId) {
      throw new ForbiddenException('Bạn không thể tự xóa tài khoản của chính mình.');
    }

    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.id = :targetId AND u.tenantId = :tenantId', { targetId, tenantId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự này.');
    }

    // Bảo vệ không cho xóa SUPER_ADMIN
    const isSuperAdmin = (user.roles || []).some((r) => r.code === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      throw new ForbiddenException('Không thể xóa tài khoản Quản Trị Viên Hệ Thống.');
    }

    // Thực hiện xóa mềm TypeORM
    await this.userRepo.softDelete({ id: targetId, tenantId });
    // Đồng bộ trạng thái sang INACTIVE
    await this.userRepo.update({ id: targetId, tenantId }, { status: 'INACTIVE' });

    return {
      success: true,
      message: `Đã chuyển nhân sự "${user.fullName}" vào danh sách lưu trữ (xóa mềm). Lịch sử dữ liệu học sinh, thực đơn và sổ kiểm thực được bảo toàn nguyên vẹn.`,
    };
  }

  /**
   * Khôi phục (Restore) tài khoản nhân sự đã xóa mềm.
   */
  async restoreStaff(tenantId: string, targetId: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .withDeleted()
      .where('u.id = :targetId AND u.tenantId = :tenantId', { targetId, tenantId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự này.');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('Tài khoản này hiện không ở trạng thái bị xóa mềm.');
    }

    // Khôi phục TypeORM
    await this.userRepo.restore({ id: targetId, tenantId });
    // Đặt lại trạng thái ACTIVE
    await this.userRepo.update({ id: targetId, tenantId }, { status: 'ACTIVE' });

    return {
      success: true,
      message: `Đã khôi phục tài khoản nhân sự "${user.fullName}" thành công.`,
    };
  }

  /**
   * Chuyển đổi nhanh trạng thái ACTIVE <-> INACTIVE.
   */
  async toggleStaffStatus(tenantId: string, currentUserId: string, targetId: string) {
    if (currentUserId === targetId) {
      throw new ForbiddenException('Bạn không thể tự khóa tài khoản của chính mình.');
    }

    const user = await this.userRepo.findOne({
      where: { id: targetId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân sự.');
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.userRepo.update({ id: targetId, tenantId }, { status: newStatus });

    return {
      success: true,
      status: newStatus,
      message: `Đã đổi trạng thái tài khoản thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}.`,
    };
  }
}
