import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepository: Repository<ClassEntity>,
  ) {}

  async create(createClassDto: CreateClassDto, tenantId: string): Promise<ClassEntity> {
    const newClass = this.classRepository.create({
      ...createClassDto,
      tenantId,
    });
    return await this.classRepository.save(newClass);
  }

  async findAll(filterDto: FilterClassDto, tenantId: string) {
    const { search, gradeLevel, status, academicYear, page = 1, limit = 10 } = filterDto;

    const query = this.classRepository.createQueryBuilder('class')
      .leftJoinAndSelect('class.mainTeacher', 'mainTeacher')
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

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
}
