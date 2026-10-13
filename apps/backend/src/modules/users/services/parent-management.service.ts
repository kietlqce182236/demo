import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { ParentProfile } from '../entities/parent-profile.entity';
import { QueryParentDto } from '../dto/parent/query-parent.dto';
import { CreateParentDto } from '../dto/parent/create-parent.dto';
import { UpdateParentDto } from '../dto/parent/update-parent.dto';

@Injectable()
export class ParentManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(ParentProfile)
    private readonly parentRepo: Repository<ParentProfile>,
  ) {}

  async findAll(query: QueryParentDto) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .innerJoin(ParentProfile, 'pp', 'pp.user_id = u.id')
      .leftJoinAndSelect('u.roles', 'r');

    if (query.search) {
      qb.andWhere('(LOWER(u.fullName) LIKE :s OR LOWER(u.email) LIKE :s OR u.phone LIKE :s)', {
        s: `%${query.search.toLowerCase()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }

    const users = await qb.getMany();
    const profiles = await this.parentRepo.find();
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // Lấy thông tin học sinh liên kết cho tất cả phụ huynh
    const childrenRows = await this.userRepo.query(`
      SELECT 
        sp.parent_id,
        sp.relationship,
        s.id as child_id,
        s.student_code,
        s.full_name,
        s.gender,
        s.date_of_birth,
        c.name as class_name
      FROM student_parents sp
      JOIN students s ON s.id = sp.student_id
      LEFT JOIN classes c ON c.id = s.class_id
      ORDER BY s.id ASC
    `);

    const childrenMap = new Map<string, any[]>();
    for (const row of childrenRows) {
      const pId = String(row.parent_id);
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId)!.push({
        id: String(row.child_id),
        studentCode: row.student_code,
        fullName: row.full_name,
        gender: row.gender,
        dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
        className: row.class_name || 'Chưa xếp lớp',
        relationship: row.relationship,
      });
    }

    return users.map((u) => {
      const p = profileMap.get(u.id);
      const uId = String(u.id);
      return {
        id: uId,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        avatarUrl: u.avatar,
        status: u.status,
        address: p?.address || '',
        occupation: p?.occupation || '',
        note: p?.note || '',
        children: childrenMap.get(uId) || [],
        createdAt: u.createdAt,
      };
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy phụ huynh');

    const profile = await this.parentRepo.findOne({ where: { userId: id } });

    const childrenRows = await this.userRepo.query(
      `
      SELECT 
        sp.parent_id,
        sp.relationship,
        s.id as child_id,
        s.student_code,
        s.full_name,
        s.gender,
        s.date_of_birth,
        c.name as class_name
      FROM student_parents sp
      JOIN students s ON s.id = sp.student_id
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE sp.parent_id = $1
      ORDER BY s.id ASC
    `,
      [id],
    );

    const children = childrenRows.map((row: any) => ({
      id: String(row.child_id),
      studentCode: row.student_code,
      fullName: row.full_name,
      gender: row.gender,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
      className: row.class_name || 'Chưa xếp lớp',
      relationship: row.relationship,
    }));

    return {
      id: String(user.id),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatar,
      status: user.status,
      address: profile?.address || '',
      occupation: profile?.occupation || '',
      note: profile?.note || '',
      children,
    };
  }

  async create(dto: CreateParentDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password || '123456', salt);

    const role = await this.roleRepo.findOne({ where: { code: 'PARENT' } });

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

    const profile = this.parentRepo.create({
      userId: savedUser.id,
      address: dto.address || null,
      occupation: dto.occupation || null,
      note: dto.note || null,
    });
    await this.parentRepo.save(profile);

    // Gán học sinh liên kết nếu có
    if (dto.childIds && dto.childIds.length > 0) {
      for (const cId of dto.childIds) {
        await this.userRepo.query(
          `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary) VALUES ($1, $2, 'GUARDIAN', true) ON CONFLICT (student_id, parent_id) DO NOTHING`,
          [cId, savedUser.id],
        );
      }
    }

    return this.findOne(savedUser.id);
  }

  async update(id: number, dto: UpdateParentDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy phụ huynh');

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

    let profile = await this.parentRepo.findOne({ where: { userId: id } });
    if (!profile) {
      profile = this.parentRepo.create({ userId: id });
    }
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.occupation !== undefined) profile.occupation = dto.occupation;
    if (dto.note !== undefined) profile.note = dto.note;
    await this.parentRepo.save(profile);

    // Cập nhật danh sách học sinh liên kết nếu có truyền childIds
    if (dto.childIds !== undefined) {
      await this.userRepo.query(`DELETE FROM student_parents WHERE parent_id = $1`, [id]);
      for (const cId of dto.childIds) {
        await this.userRepo.query(
          `INSERT INTO student_parents (student_id, parent_id, relationship, is_primary) VALUES ($1, $2, 'GUARDIAN', true) ON CONFLICT (student_id, parent_id) DO NOTHING`,
          [cId, id],
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy phụ huynh');
    await this.userRepo.update(id, { status: 'INACTIVE' });
    return { success: true, message: 'Đã tạm ngưng tài khoản phụ huynh' };
  }

  async getStats() {
    const totalParents = await this.parentRepo.count();
    const users = await this.userRepo.find();
    const profiles = await this.parentRepo.find();
    const parentUserIds = new Set(profiles.map((p) => p.userId));
    const parentUsers = users.filter((u) => parentUserIds.has(u.id));

    const activeParents = parentUsers.filter((u) => u.status === 'ACTIVE').length;
    const inactiveParents = parentUsers.filter((u) => u.status === 'INACTIVE').length;

    const linkedCountRes = await this.userRepo.query(`
      SELECT COUNT(DISTINCT parent_id) as count FROM student_parents
    `);
    const parentsWithChildren = parseInt(linkedCountRes?.[0]?.count || '0', 10);

    return {
      totalParents: parentUsers.length || totalParents,
      activeParents,
      inactiveParents,
      parentsWithChildren,
      verifiedParents: activeParents,
    };
  }

  async restore(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy phụ huynh');
    await this.userRepo.update(id, { status: 'ACTIVE' });
    return { success: true, message: 'Đã khôi phục tài khoản phụ huynh' };
  }
}
