import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { Child } from '../children/entities/child.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
  ) {}

  async findAll(filter: FilterClassDto) {
    const qb = this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.homeroomTeacher', 'teacher');

    if (filter.search) {
      qb.andWhere('LOWER(c.name) LIKE :search', { search: `%${filter.search.toLowerCase()}%` });
    }
    if (filter.ageGroup) {
      qb.andWhere('c.ageGroup = :ageGroup', { ageGroup: filter.ageGroup });
    }
    if (filter.schoolYear) {
      qb.andWhere('c.schoolYear = :schoolYear', { schoolYear: filter.schoolYear });
    }
    if (filter.status) {
      qb.andWhere('c.status = :status', { status: filter.status });
    }

    qb.orderBy('c.id', 'ASC');
    const classes = await qb.getMany();

    // Enrich with student count & allergy count
    const enriched = await Promise.all(
      classes.map(async (cls) => {
        const students = await this.childRepo.find({
          where: { classId: cls.id },
          relations: ['allergies'],
        });

        const studentCount = students.length;
        const allergicCount = students.filter((s) => s.allergies && s.allergies.length > 0).length;

        return {
          ...cls,
          studentCount,
          allergicCount,
          hasAllergyAlert: allergicCount > 0,
        };
      }),
    );

    return enriched;
  }

  async findOne(id: number) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['homeroomTeacher'],
    });
    if (!cls) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID: ${id}`);
    }

    const students = await this.childRepo.find({
      where: { classId: cls.id },
      relations: ['allergies', 'allergies.allergen'],
    });

    return {
      ...cls,
      studentCount: students.length,
      students,
    };
  }

  async create(dto: CreateClassDto) {
    let ageGroup = dto.ageGroup;
    if (!ageGroup && dto.gradeLevel) {
      ageGroup =
        dto.gradeLevel.includes('TODDLER') || dto.gradeLevel.includes('INFANT')
          ? 'NHA_TRE'
          : 'MAU_GIAO';
    }
    if (!ageGroup) {
      const name = (dto.name || '').toLowerCase();
      ageGroup = name.includes('nhà trẻ') || name.includes('nha tre') ? 'NHA_TRE' : 'MAU_GIAO';
    }

    const schoolYear = dto.schoolYear || dto.academicYear || '2026-2027';
    let homeroomTeacherId: number | null = null;
    const rawTeacherId = dto.homeroomTeacherId !== undefined ? dto.homeroomTeacherId : dto.mainTeacherId;
    if (rawTeacherId && Number(rawTeacherId) > 0) {
      homeroomTeacherId = Number(rawTeacherId);
    }

    const cls = this.classRepo.create({
      schoolId: 1,
      name: dto.name,
      ageGroup,
      schoolYear,
      homeroomTeacherId,
      status: dto.status || 'ACTIVE',
    });
    const saved = await this.classRepo.save(cls);
    return this.classRepo.findOne({
      where: { id: saved.id },
      relations: ['homeroomTeacher'],
    });
  }

  async update(id: number, dto: UpdateClassDto) {
    const cls = await this.classRepo.findOne({ where: { id } });
    if (!cls) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID: ${id}`);
    }

    let ageGroup = dto.ageGroup;
    if (!ageGroup && dto.gradeLevel) {
      ageGroup =
        dto.gradeLevel.includes('TODDLER') || dto.gradeLevel.includes('INFANT')
          ? 'NHA_TRE'
          : 'MAU_GIAO';
    }

    const schoolYear = dto.schoolYear || dto.academicYear;
    if (dto.homeroomTeacherId !== undefined || dto.mainTeacherId !== undefined) {
      const rawTeacherId = dto.homeroomTeacherId !== undefined ? dto.homeroomTeacherId : dto.mainTeacherId;
      cls.homeroomTeacherId = rawTeacherId && Number(rawTeacherId) > 0 ? Number(rawTeacherId) : null;
    }

    if (dto.name !== undefined) cls.name = dto.name;
    if (ageGroup !== undefined) cls.ageGroup = ageGroup;
    if (schoolYear !== undefined) cls.schoolYear = schoolYear;
    if (dto.status !== undefined) cls.status = dto.status;

    const updated = await this.classRepo.save(cls);
    return this.classRepo.findOne({
      where: { id: updated.id },
      relations: ['homeroomTeacher'],
    });
  }

  async remove(id: number) {
    const cls = await this.classRepo.findOne({ where: { id } });
    if (!cls) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID: ${id}`);
    }
    await this.classRepo.remove(cls);
    return { success: true, message: 'Đã xóa lớp học' };
  }

  async getStudents(classId: number) {
    return this.childRepo.find({
      where: { classId },
      relations: ['allergies', 'allergies.allergen'],
      order: { fullName: 'ASC' },
    });
  }

  async addStudents(classId: number, childIds: number[]) {
    if (!childIds || childIds.length === 0) return { success: true };
    await this.childRepo.update({ id: In(childIds) }, { classId });
    return { success: true, count: childIds.length };
  }

  async removeStudent(classId: number, childId: number) {
    const child = await this.childRepo.findOne({ where: { id: childId, classId } });
    if (child) {
      child.classId = null;
      await this.childRepo.save(child);
    }
    return { success: true };
  }
}
