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
      .innerJoin(StaffProfile, 'sp', 'sp.user_id = u.id')
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
      return {
        id: String(u.id),
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        avatarUrl: u.avatar,
        status: u.status,
        roles: u.roles?.map((r) => r.code) || [],
        staffType: p?.staffType || 'MANAGEMENT',
        position: p?.position || '',
        startDate: p?.startDate || null,
        createdAt: u.createdAt,
      };
    });

    if (query.staffType) {
      results = results.filter((s) => s.staffType === query.staffType);
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

    const role = await this.roleRepo.findOne({ where: { code: dto.roleCode } });

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone || null,
      status: 'ACTIVE',
      roles: role ? [role] : [],
    });

    const savedUser = await this.userRepo.save(user);

    const profile = this.staffRepo.create({
      userId: savedUser.id,
      staffType: dto.staffType,
      position: dto.position || null,
      startDate: new Date().toISOString().split('T')[0],
    });
    await this.staffRepo.save(profile);

    return this.findOne(savedUser.id);
  }

  async update(id: number, dto: UpdateStaffDto) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['roles'] });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.phone) user.phone = dto.phone;
    if (dto.status) user.status = dto.status;

    if (dto.roleCode) {
      const role = await this.roleRepo.findOne({ where: { code: dto.roleCode } });
      if (role) user.roles = [role];
    }
    await this.userRepo.save(user);

    let profile = await this.staffRepo.findOne({ where: { userId: id } });
    if (!profile) {
      profile = this.staffRepo.create({ userId: id });
    }
    if (dto.staffType) profile.staffType = dto.staffType;
    if (dto.position) profile.position = dto.position;
    await this.staffRepo.save(profile);

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    user.status = 'INACTIVE';
    await this.userRepo.save(user);
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
    return roles.map((r) => ({ code: r.code, name: r.name, description: (r as any).description || r.name }));
  }

  async restore(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân sự');
    user.status = 'ACTIVE';
    await this.userRepo.save(user);
    return { success: true, message: 'Đã khôi phục nhân sự' };
  }

  async toggleStatus(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân sự');
    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.userRepo.save(user);
    return { success: true, status: user.status, message: `Đã đổi trạng thái sang ${user.status}` };
  }
}
