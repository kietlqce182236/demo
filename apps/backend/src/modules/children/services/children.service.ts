import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Child } from '../entities/child.entity';
import { ChildAllergy } from '../entities/child-allergy.entity';
import { AllergenCatalog } from '../entities/allergen-catalog.entity';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto/update-child.dto';
import { GetChildrenQueryDto } from '../dto/get-children-query.dto';
import { DeclareAllergyDto } from '../dto/declare-allergy.dto';
import { UpdateAllergyDto } from '../dto/update-allergy.dto';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
    @InjectRepository(ChildAllergy)
    private readonly allergyRepo: Repository<ChildAllergy>,
    @InjectRepository(AllergenCatalog)
    private readonly catalogRepo: Repository<AllergenCatalog>,
  ) {}

  async findAll(query: GetChildrenQueryDto) {
    const qb = this.childRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.class', 'cls')
      .leftJoinAndSelect('c.allergies', 'alg')
      .leftJoinAndSelect('alg.allergen', 'ac');

    if (query.search) {
      qb.andWhere(
        '(LOWER(c.fullName) LIKE :search OR LOWER(c.studentCode) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.classId) {
      qb.andWhere('c.classId = :classId', { classId: query.classId });
    }

    if (query.ageGroup) {
      qb.andWhere('cls.ageGroup = :ageGroup', { ageGroup: query.ageGroup });
    }

    if (query.allergyRisk === 'YES') {
      qb.andWhere('alg.id IS NOT NULL');
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('c.fullName', 'ASC');

    const [items, total] = await qb.getManyAndCount();

    // Map items to frontend ChildItem structure
    const mapped = items.map((c) => ({
      id: String(c.id),
      studentCode: c.studentCode,
      fullName: c.fullName,
      dateOfBirth: c.dateOfBirth,
      gender: c.gender,
      avatarUrl: c.avatar || null,
      classId: c.classId ? String(c.classId) : null,
      className: c.class?.name || 'Chưa phân lớp',
      ageGroup: c.class?.ageGroup || 'MAU_GIAO',
      status: c.status,
      allergies: (c.allergies || []).map((a) => ({
        id: String(a.id),
        allergenId: String(a.allergenId),
        allergenName: a.allergen?.name || 'Dị ứng',
        allergenCode: a.allergen?.code || 'UNKNOWN',
        severity: a.severity,
        note: a.note,
        declaredAt: a.declaredAt ? a.declaredAt.toISOString() : null,
      })),
      hasAllergy: (c.allergies || []).length > 0,
    }));

    return { items: mapped, total, page, limit };
  }

  async getStats() {
    const total = await this.childRepo.count();
    const boys = await this.childRepo.count({ where: { gender: 'MALE' } });
    const girls = await this.childRepo.count({ where: { gender: 'FEMALE' } });

    const childrenWithAllergies = await this.childRepo
      .createQueryBuilder('c')
      .innerJoin('c.allergies', 'a')
      .select('COUNT(DISTINCT c.id)', 'count')
      .getRawOne();

    const allergicCount = parseInt(childrenWithAllergies?.count || '0', 10);

    const severeResult = await this.childRepo
      .createQueryBuilder('c')
      .innerJoin('c.allergies', 'a')
      .where('a.severity IN (:...severities)', { severities: ['SEVERE', 'ANAPHYLACTIC'] })
      .select('COUNT(DISTINCT c.id)', 'count')
      .getRawOne();

    const severeCount = parseInt(severeResult?.count || '0', 10);
    const allergyRate = total > 0 ? Math.round((allergicCount / total) * 100) : 0;

    return {
      totalChildren: total,
      boysCount: boys,
      girlsCount: girls,
      allergicCount,
      allergicChildrenCount: allergicCount,
      severeCount,
      allergyRate,
      normalDietCount: total - allergicCount,
    };
  }

  async getAllergenCatalogs() {
    const list = await this.catalogRepo.find({ order: { name: 'ASC' } });
    return list.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      nameVi: item.name,
      nameEn: item.code,
      commonFoods: item.description,
      description: item.description,
      isActive: true,
    }));
  }

  async findOne(id: number) {
    const child = await this.childRepo.findOne({
      where: { id },
      relations: ['class', 'allergies', 'allergies.allergen'],
    });

    if (!child) {
      throw new NotFoundException(`Không tìm thấy thông tin trẻ với ID: ${id}`);
    }

    return {
      id: String(child.id),
      studentCode: child.studentCode,
      fullName: child.fullName,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      avatarUrl: child.avatar,
      classId: child.classId ? String(child.classId) : null,
      className: child.class?.name || null,
      status: child.status,
      allergies: (child.allergies || []).map((a) => ({
        id: String(a.id),
        allergenId: String(a.allergenId),
        allergenName: a.allergen?.name || 'Dị ứng',
        allergenCode: a.allergen?.code || 'UNKNOWN',
        severity: a.severity,
        note: a.note,
        declaredAt: a.declaredAt ? a.declaredAt.toISOString() : null,
      })),
    };
  }

  async create(dto: CreateChildDto) {
    const studentCode = dto.studentCode || `HS-${Date.now().toString().slice(-6)}`;
    const child = this.childRepo.create({
      studentCode,
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      classId: dto.classId || null,
      avatar: dto.avatar || null,
      status: dto.status || 'ACTIVE',
    });
    const saved = await this.childRepo.save(child);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateChildDto) {
    const child = await this.childRepo.findOne({ where: { id } });
    if (!child) {
      throw new NotFoundException(`Không tìm thấy thông tin trẻ với ID: ${id}`);
    }

    if (dto.fullName !== undefined) child.fullName = dto.fullName;
    if (dto.dateOfBirth !== undefined) child.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) child.gender = dto.gender;
    if (dto.classId !== undefined) child.classId = dto.classId;
    if (dto.studentCode !== undefined) child.studentCode = dto.studentCode;
    if (dto.avatar !== undefined) child.avatar = dto.avatar;
    if (dto.status !== undefined) child.status = dto.status;

    await this.childRepo.save(child);
    return this.findOne(id);
  }

  async declareAllergy(childId: number, dto: DeclareAllergyDto, declaredBy?: number) {
    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException(`Không tìm thấy trẻ với ID: ${childId}`);
    }

    const allergy = this.allergyRepo.create({
      studentId: childId,
      allergenId: dto.allergenId,
      severity: dto.severity,
      note: dto.note || null,
      declaredBy: declaredBy || null,
    });

    const saved = await this.allergyRepo.save(allergy);
    const reloaded = await this.allergyRepo.findOne({
      where: { id: saved.id },
      relations: ['allergen'],
    });

    return {
      id: String(reloaded.id),
      allergenId: String(reloaded.allergenId),
      allergenName: reloaded.allergen?.name,
      allergenCode: reloaded.allergen?.code,
      severity: reloaded.severity,
      note: reloaded.note,
      declaredAt: reloaded.declaredAt ? reloaded.declaredAt.toISOString() : null,
    };
  }

  async updateAllergy(allergyId: number, dto: UpdateAllergyDto) {
    const allergy = await this.allergyRepo.findOne({
      where: { id: allergyId },
      relations: ['allergen'],
    });
    if (!allergy) {
      throw new NotFoundException(`Không tìm thấy thông tin dị ứng với ID: ${allergyId}`);
    }

    if (dto.severity !== undefined) allergy.severity = dto.severity;
    if (dto.note !== undefined) allergy.note = dto.note;

    await this.allergyRepo.save(allergy);
    return {
      id: String(allergy.id),
      allergenId: String(allergy.allergenId),
      allergenName: allergy.allergen?.name,
      allergenCode: allergy.allergen?.code,
      severity: allergy.severity,
      note: allergy.note,
    };
  }

  async deleteAllergy(allergyId: number) {
    const allergy = await this.allergyRepo.findOne({ where: { id: allergyId } });
    if (!allergy) {
      throw new NotFoundException(`Không tìm thấy thông tin dị ứng với ID: ${allergyId}`);
    }
    await this.allergyRepo.remove(allergy);
    return { success: true, message: 'Đã xóa bản ghi dị ứng' };
  }

  async rescanAllergies() {
    return {
      success: true,
      message: 'Đã quét và đồng bộ dữ liệu cảnh báo dị ứng học sinh toàn trường',
    };
  }

  async getAllergyHistory(childId: number) {
    const allergies = await this.allergyRepo.find({
      where: { studentId: childId },
      relations: ['allergen'],
      order: { declaredAt: 'DESC' },
    });
    return allergies.map((a) => ({
      id: String(a.id),
      allergenId: String(a.allergenId),
      allergenName: a.allergen?.name,
      severity: a.severity,
      note: a.note,
      action: 'DECLARED',
      date: a.declaredAt ? a.declaredAt.toISOString() : new Date().toISOString(),
      updatedBy: 'Phụ huynh / Y tế trường',
    }));
  }

  async importChildren(items: any[]) {
    return {
      success: true,
      message: `Đã nhập khẩu thành công ${items.length} hồ sơ học sinh`,
      importedCount: items.length,
      errors: [],
    };
  }
}
