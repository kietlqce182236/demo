import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { StaffProfile } from '../entities/staff-profile.entity';
import { QueryStaffDto } from '../dto/staff/query-staff.dto';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';

@Injectable()
export class StaffManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(StaffProfile)
    private readonly staffRepo: Repository<StaffProfile>,
  ) {}

  async findAll(query: QueryStaffDto) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoin(StaffProfile, 'sp', 'sp.user_id = u.id')
      .addSelect(['sp.staffType', 'sp.position', 'sp.startDate']);

    if (query.search) {
      qb.andWhere('(LOWER(u.fullName) LIKE :s OR LOWER(u.email) LIKE :s OR u.phone LIKE :s)', {
        s: `%${query.search.toLowerCase()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }

    const users = await qb.getMany();
    const staffProfiles = await this.staffRepo.find();
    const profileMap = new Map(staffProfiles.map((p) => [p.userId, p]));

    let results = users.map((u) => {
      const p = profileMap.get(u.id);
      const isTeacherRole = u.roles?.some((r) => r.code === 'TEACHER');
      return {
        id: String(u.id),
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        avatarUrl: u.avatar,
        status: u.status,
        roles: u.roles?.map((r) => r.code) || [],
        staffType: p?.staffType || (isTeacherRole ? 'TEACHER' : 'MANAGEMENT'),
        position: p?.position || (isTeacherRole ? 'Giáo viên mầm non' : ''),
        startDate: p?.startDate || null,
        createdAt: u.createdAt,
      };
    });

    const targetType = (query.staffType || query.roleCode || '').toUpperCase();
    if (targetType) {
      results = results.filter((s) => 
        s.staffType?.toUpperCase() === targetType || 
        s.roles.some((r) => r.toUpperCase() === targetType)
      );
    }

    return results;
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('Không tìm thấy cán bộ/nhân viên');

    const profile = await this.staffRepo.findOne({ where: { userId: id } });

    return {
      id: String(user.id),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatar,
      status: user.status,
      roles: user.roles?.map((r) => r.code) || [],
      staffType: profile?.staffType || 'MANAGEMENT',
      position: profile?.position || '',
      startDate: profile?.startDate || null,
    };
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password || '123456', salt);

    const targetRoleCode = dto.roleCode || (dto.roleCodes && dto.roleCodes.length > 0 ? dto.roleCodes[0] : 'TEACHER');
    const role = await this.roleRepo.findOne({ where: { code: targetRoleCode } });

    let derivedStaffType = dto.staffType;
    if (!derivedStaffType) {
      switch (targetRoleCode) {
        case 'TEACHER':
          derivedStaffType = 'TEACHER';
          break;
        case 'KITCHEN_STAFF':
        case 'KITCHEN_MANAGER':
          derivedStaffType = 'KITCHEN';
          break;
        case 'NUTRITIONIST':
        case 'MEDICAL_STAFF':
          derivedStaffType = 'SPECIALIST';
          break;
        case 'SCHOOL_MANAGER':
        case 'PRINCIPAL':
        default:
          derivedStaffType = 'MANAGEMENT';
          break;
      }
    }

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone || null,
      status: dto.status || 'ACTIVE',
    });

    const savedUser = await this.userRepo.save(user);

    if (role) {
      await this.userRepo.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING`,
        [savedUser.id, role.id],
      );
    }

    const profile = this.staffRepo.create({
      userId: savedUser.id,
      staffType: derivedStaffType,
      position: dto.position || (targetRoleCode === 'TEACHER' ? 'Giáo viên mầm non' : null),
      startDate: new Date().toISOString().split('T')[0],
    });
    await this.staffRepo.save(profile);

    return this.findOne(savedUser.id);
  }

  async update(id: number, dto: UpdateStaffDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');

    const updateData: Partial<User> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.status) updateData.status = dto.status;

    if (dto.newPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.update(id, updateData);
    }

    const targetRoleCode = dto.roleCode || (dto.roleCodes && dto.roleCodes.length > 0 ? dto.roleCodes[0] : undefined);
    if (targetRoleCode) {
      const role = await this.roleRepo.findOne({ where: { code: targetRoleCode } });
      if (role) {
        await this.userRepo.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
        await this.userRepo.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING`,
          [id, role.id],
        );
      }
    }

    let profile = await this.staffRepo.findOne({ where: { userId: id } });
    if (!profile) {
      profile = this.staffRepo.create({ userId: id });
    }
    if (dto.staffType) {
      profile.staffType = dto.staffType;
    } else if (targetRoleCode) {
      switch (targetRoleCode) {
        case 'TEACHER':
          profile.staffType = 'TEACHER';
          break;
        case 'KITCHEN_STAFF':
        case 'KITCHEN_MANAGER':
          profile.staffType = 'KITCHEN';
          break;
        case 'NUTRITIONIST':
        case 'MEDICAL_STAFF':
          profile.staffType = 'SPECIALIST';
          break;
        case 'SCHOOL_MANAGER':
        case 'PRINCIPAL':
        default:
          profile.staffType = 'MANAGEMENT';
          break;
      }
    }
    if (dto.position) profile.position = dto.position;
    await this.staffRepo.save(profile);

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    await this.userRepo.update(id, { status: 'INACTIVE' });
    return { success: true, message: 'Đã tạm ngưng cán bộ/nhân viên' };
  }

  async getStats() {
    const totalStaff = await this.staffRepo.count();
    const users = await this.userRepo.find({ relations: ['roles'] });
    const staffProfiles = await this.staffRepo.find();
    const staffUserIds = new Set(staffProfiles.map((p) => p.userId));
    const staffUsers = users.filter((u) => staffUserIds.has(u.id));

    const activeStaff = staffUsers.filter((u) => u.status === 'ACTIVE').length;
    const teachingStaff = staffUsers.filter((u) => u.roles?.some((r) => r.code === 'TEACHER')).length;
    const kitchenStaff = staffUsers.filter((u) => u.roles?.some((r) => r.code === 'KITCHEN_STAFF')).length;
    const nutritionStaff = staffUsers.filter((u) => u.roles?.some((r) => r.code === 'NUTRITIONIST')).length;
    const managementStaff = staffUsers.filter((u) =>
      u.roles?.some((r) => r.code === 'SCHOOL_MANAGER' || r.code === 'PRINCIPAL' || r.code === 'SUPER_ADMIN'),
    ).length;

    return {
      totalStaff: staffUsers.length || totalStaff,
      activeStaff,
      teachingStaff,
      kitchenStaff,
      nutritionStaff,
      managementStaff,
      onLeaveStaff: 0,
    };
  }

  async getRoles() {
    const roles = await this.roleRepo.find();
    // Loại trừ các role không phải nhân sự trường học (chẳng hạn PARENT) và SUPER_ADMIN
    const staffRoles = roles.filter((r) => r.code !== 'PARENT' && r.code !== 'SUPER_ADMIN');
    return staffRoles.map((r) => ({ code: r.code, name: r.name, description: (r as any).description || r.name }));
  }

  async restore(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân sự');
    await this.userRepo.update(id, { status: 'ACTIVE' });
    return { success: true, message: 'Đã khôi phục nhân sự' };
  }

  async toggleStatus(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân sự');
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.userRepo.update(id, { status: newStatus });
    return { success: true, status: newStatus, message: `Đã đổi trạng thái sang ${newStatus}` };
  }
}
