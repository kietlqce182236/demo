import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { Child } from '../../children/entities/child.entity';
import { CreateParentDto } from '../dto/parent/create-parent.dto';
import { UpdateParentDto } from '../dto/parent/update-parent.dto';
import { QueryParentDto } from '../dto/parent/query-parent.dto';

@Injectable()
export class ParentManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
  ) {}

  async getParentList(tenantId: string, query: QueryParentDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('r.code = :roleCode', { roleCode: 'PARENT' });

    if (query.includeDeleted) {
      qb.withDeleted();
    }

    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.fullName) LIKE :s OR LOWER(u.email) LIKE :s OR u.phone LIKE :s)',
        { s },
      );
    }

    if (query.status && query.status.trim()) {
      if (query.status === 'DELETED') {
        qb.andWhere('u.deletedAt IS NOT NULL');
      } else {
        qb.andWhere('u.status = :status', { status: query.status.trim() });
      }
    }

    const validSortFields = ['fullName', 'email', 'createdAt', 'lastLoginAt'];
    const sortBy = validSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`u.${sortBy}`, sortOrder);

    qb.skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    // Query linked children for all retrieved users
    const userIds = users.map((u) => u.id);
    let childrenByParentId: Record<string, any[]> = {};

    if (userIds.length > 0) {
      const children = await this.childRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.class', 'cls')
        .where('c.parentId IN (:...userIds)', { userIds })
        .andWhere('c.deletedAt IS NULL')
        .getMany();

      for (const ch of children) {
        if (ch.parentId) {
          if (!childrenByParentId[ch.parentId]) {
            childrenByParentId[ch.parentId] = [];
          }
          childrenByParentId[ch.parentId].push({
            id: ch.id,
            studentCode: ch.studentCode,
            fullName: ch.fullName,
            gender: ch.gender,
            dateOfBirth: ch.dateOfBirth,
            className: ch.class?.name || 'Chưa xếp lớp',
          });
        }
      }
    }

    const data = users.map((u) => ({
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
      isDeleted: !!u.deletedAt,
      children: childrenByParentId[u.id] || [],
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParentStats(tenantId: string) {
    const parentRoleSubQuery = `
      SELECT ur.user_id FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.code = 'PARENT'
    `;

    const total = await this.userRepo
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere(`u.id IN (${parentRoleSubQuery})`)
      .getCount();

    const active = await this.userRepo
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.status = :status', { status: 'ACTIVE' })
      .andWhere(`u.id IN (${parentRoleSubQuery})`)
      .getCount();

    const linked = await this.childRepo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.parentId)', 'count')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.parentId IS NOT NULL')
      .andWhere('c.deletedAt IS NULL')
      .getRawOne();

    return {
      totalParents: total,
      activeParents: active,
      parentsWithChildren: parseInt(linked?.count || '0', 10),
      inactiveOrDeleted: total - active,
    };
  }

  async createParent(tenantId: string, dto: CreateParentDto) {
    // 1. Kiểm tra email đã tồn tại trong trường chưa
    const existing = await this.userRepo.findOne({
      where: { tenantId, email: dto.email.trim().toLowerCase() },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} đã tồn tại trong hệ thống.`);
    }

    // 2. Tìm role PARENT
    const parentRole = await this.roleRepo.findOne({ where: { code: 'PARENT' } });
    if (!parentRole) {
      throw new BadRequestException('Vai trò PARENT không tồn tại trong hệ thống.');
    }

    // 3. Hash mật khẩu (mặc định 'Parent@123')
    const rawPassword = dto.password || 'Parent@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 4. Lưu user
    const newUser = this.userRepo.create({
      tenantId,
      email: dto.email.trim().toLowerCase(),
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() || null,
      passwordHash,
      status: dto.status || 'ACTIVE',
      roles: [parentRole],
    });

    const savedUser = await this.userRepo.save(newUser);

    // 5. Liên kết con nếu có
    if (dto.childIds && dto.childIds.length > 0) {
      await this.childRepo.update(
        { id: In(dto.childIds), tenantId },
        { parentId: savedUser.id },
      );
    }

    return {
      success: true,
      message: 'Tạo tài khoản phụ huynh thành công!',
      id: savedUser.id,
      email: savedUser.email,
      fullName: savedUser.fullName,
    };
  }

  async updateParent(tenantId: string, id: string, dto: UpdateParentDto) {
    const user = await this.userRepo.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy phụ huynh với ID ${id}`);
    }

    if (dto.fullName) user.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone?.trim() || null;
    if (dto.status) user.status = dto.status;

    if (dto.newPassword && dto.newPassword.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.newPassword.trim(), salt);
    }

    await this.userRepo.save(user);

    // Cập nhật liên kết trẻ em nếu được chỉ định
    if (dto.childIds !== undefined) {
      // Hủy liên kết các trẻ cũ không còn trong danh sách
      const currentChildren = await this.childRepo.find({
        where: { parentId: id, tenantId },
      });
      const toUnlink = currentChildren
        .filter((c) => !dto.childIds!.includes(c.id))
        .map((c) => c.id);

      if (toUnlink.length > 0) {
        await this.childRepo.update({ id: In(toUnlink), tenantId }, { parentId: null as any });
      }

      // Gán liên kết cho các trẻ mới
      if (dto.childIds.length > 0) {
        await this.childRepo.update(
          { id: In(dto.childIds), tenantId },
          { parentId: id },
        );
      }
    }

    return {
      success: true,
      message: 'Cập nhật tài khoản phụ huynh thành công!',
    };
  }

  async deleteParent(tenantId: string, id: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy phụ huynh với ID ${id}`);
    }

    // Xóa mềm tài khoản
    await this.userRepo.softDelete({ id, tenantId });

    // Hủy liên kết trẻ em
    await this.childRepo.update({ parentId: id, tenantId }, { parentId: null as any });

    return {
      success: true,
      message: 'Đã xóa tài khoản phụ huynh và hủy liên kết học sinh.',
    };
  }

  async restoreParent(tenantId: string, id: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy phụ huynh với ID ${id}`);
    }

    await this.userRepo.restore({ id, tenantId });
    user.status = 'ACTIVE';
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Đã khôi phục tài khoản phụ huynh thành công!',
    };
  }
}
