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
    private readonly classRepository: Repository<ClassEntity>,
    @InjectRepository(Child)
    private readonly childRepository: Repository<Child>,
  ) {}

  async create(createClassDto: CreateClassDto, tenantId: string): Promise<ClassEntity> {
    const newClass = this.classRepository.create({
      ...createClassDto,
      tenantId,
    });
    return await this.classRepository.save(newClass);
  }

  async findAll(filterDto: FilterClassDto, tenantId: string) {
    const { search, gradeLevel, status, academicYear, page = 1, limit = 20 } = filterDto;

    const query = this.classRepository.createQueryBuilder('class')
      .leftJoinAndSelect('class.mainTeacher', 'mainTeacher')
      .addSelect((sub) => {
        return sub
          .select('COUNT(c.id)', 'count')
          .from('children', 'c')
          .where('c.class_id = class.id')
          .andWhere("c.status = 'ACTIVE'");
      }, 'student_count')
      .addSelect((sub) => {
        return sub
          .select('COUNT(DISTINCT ca.child_id)', 'count')
          .from('child_allergies', 'ca')
          .innerJoin('children', 'c', 'c.id = ca.child_id')
          .where('c.class_id = class.id')
          .andWhere('ca.is_active = true')
          .andWhere("c.status = 'ACTIVE'");
      }, 'allergic_count')
      .where('class.tenantId = :tenantId', { tenantId });

    if (search) {
      query.andWhere('class.name ILIKE :search', { search: `%${search}%` });
    }
    if (gradeLevel) {
      query.andWhere('class.gradeLevel = :gradeLevel', { gradeLevel });
    }
    if (status) {
      query.andWhere('class.status = :status', { status });
    }
    if (academicYear) {
      query.andWhere('class.academicYear = :academicYear', { academicYear });
    }

    query.orderBy('class.createdAt', 'DESC');

    const total = await query.getCount();
    const { entities, raw } = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const items = entities.map((entity, index) => {
      const rawRow = raw[index] || {};
      const studentCount = parseInt(rawRow.student_count || rawRow.studentCount || '0', 10);
      const allergicCount = parseInt(rawRow.allergic_count || rawRow.allergicCount || '0', 10);
      const maxCapacity = entity.gradeLevel?.startsWith('INFANT') ? 20 : entity.gradeLevel?.startsWith('TODDLER') ? 25 : 30;

      return {
        ...entity,
        studentCount,
        allergicCount,
        maxCapacity,
      };
    });

    return {
      items,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<ClassEntity> {
    const classEntity = await this.classRepository.findOne({
      where: { id, tenantId },
      relations: ['mainTeacher'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto, tenantId: string): Promise<ClassEntity> {
    const classEntity = await this.findOne(id, tenantId);
    
    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async remove(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const classEntity = await this.findOne(id, tenantId);
    // Gỡ liên kết học sinh khỏi lớp trước khi xóa
    await this.childRepository.update({ classId: id, tenantId }, { classId: null as any });
    await this.classRepository.remove(classEntity);
    return { success: true, message: 'Đã xóa lớp học thành công' };
  }

  async getClassStudents(classId: string, tenantId: string) {
    await this.findOne(classId, tenantId);
    return await this.childRepository.find({
      where: { classId, tenantId },
      relations: ['allergies', 'allergies.allergenCatalog', 'parent'],
      order: { fullName: 'ASC' },
    });
  }

  async addStudentsToClass(classId: string, childIds: string[], tenantId: string) {
    const classEntity = await this.findOne(classId, tenantId);
    if (!childIds || childIds.length === 0) {
      return { success: true, updatedCount: 0, message: 'Không có học sinh nào được chọn' };
    }

    const children = await this.childRepository.find({
      where: { id: In(childIds), tenantId },
    });

    for (const child of children) {
      child.classId = classId;
    }
    await this.childRepository.save(children);

    return {
      success: true,
      updatedCount: children.length,
      message: `Đã thêm ${children.length} học sinh vào ${classEntity.name}`,
    };
  }

  async removeStudentFromClass(classId: string, childId: string, tenantId: string) {
    await this.findOne(classId, tenantId);
    const child = await this.childRepository.findOne({
      where: { id: childId, classId, tenantId },
    });
    if (!child) {
      throw new NotFoundException(`Học sinh không tồn tại trong lớp này`);
    }
    child.classId = null as any;
    await this.childRepository.save(child);
    return { success: true, message: 'Đã xóa học sinh khỏi lớp thành công' };
  }
}
