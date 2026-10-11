import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrowthRecord, GrowthZscore } from '../entities/growth-record.entity';
import { Child } from '../../children/entities/child.entity';
import { WhoZscoreService } from './who-zscore.service';
import { CreateGrowthRecordDto } from '../dto/create-growth-record.dto';
import { QueryGrowthRecordsDto } from '../dto/query-growth-records.dto';

@Injectable()
export class GrowthService {
  constructor(
    @InjectRepository(GrowthRecord)
    private readonly growthRepo: Repository<GrowthRecord>,
    @InjectRepository(GrowthZscore)
    private readonly zscoreRepo: Repository<GrowthZscore>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
    private readonly whoService: WhoZscoreService,
  ) {}

  private mapToItem(record: GrowthRecord) {
    const student = record.student;
    const zscore = record.zscore;

    let ageInMonths = 0;
    let bmi = 0;
    if (student && student.dateOfBirth && record.measuredDate) {
      const dob = new Date(student.dateOfBirth);
      const md = new Date(record.measuredDate);
      ageInMonths = Math.max(
        0,
        (md.getFullYear() - dob.getFullYear()) * 12 + (md.getMonth() - dob.getMonth()),
      );
    }

    if (record.heightCm && record.heightCm > 0 && record.weightKg) {
      const hM = Number(record.heightCm) / 100;
      bmi = Math.round((Number(record.weightKg) / (hM * hM)) * 100) / 100;
    }

    let waz = zscore?.waz != null ? Number(zscore.waz) : 0;
    let haz = zscore?.haz != null ? Number(zscore.haz) : 0;
    let baz = zscore?.baz != null ? Number(zscore.baz) : 0;

    // Tự động tính toán lại Z-Score chính xác nếu bản ghi cũ bị 0
    if (waz === 0 && haz === 0 && baz === 0 && student && record.heightCm && record.weightKg) {
      const gender = (student.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE';
      const calc = this.whoService.calculateSync(
        gender,
        ageInMonths,
        Number(record.weightKg),
        Number(record.heightCm),
        bmi,
      );
      waz = calc.waz;
      haz = calc.haz;
      baz = calc.baz;
    }

    let weightClassification = 'NORMAL';
    if (waz < -3) weightClassification = 'SEVERELY_UNDERWEIGHT';
    else if (waz < -2) weightClassification = 'UNDERWEIGHT';
    else if (waz > 3) weightClassification = 'SEVERELY_OVERWEIGHT';
    else if (waz > 2) weightClassification = 'OVERWEIGHT';

    let heightClassification = 'NORMAL';
    if (haz < -3) heightClassification = 'SEVERELY_STUNTED';
    else if (haz < -2) heightClassification = 'STUNTED';

    let bmiClassification = 'NORMAL';
    if (baz > 3 || (bmi != null && bmi >= 25)) bmiClassification = 'OBESE';
    else if (baz > 2 || (bmi != null && bmi >= 19)) bmiClassification = 'OVERWEIGHT';
    else if (baz < -3) bmiClassification = 'SEVERELY_WASTED';
    else if (baz < -2) bmiClassification = 'WASTED';

    let overall = bmiClassification;
    if (overall === 'NORMAL') {
      if (heightClassification !== 'NORMAL') overall = heightClassification;
      else if (weightClassification !== 'NORMAL') overall = weightClassification;
    }

    return {
      id: String(record.id),
      tenantId: student?.class?.schoolId ? String(student.class.schoolId) : '',
      childId: student ? String(student.id) : String(record.studentId),
      child: student
        ? {
            id: String(student.id),
            fullName: student.fullName,
            studentCode: student.studentCode,
            gender: student.gender as 'MALE' | 'FEMALE',
            dateOfBirth: student.dateOfBirth,
            class: student.class
              ? {
                  id: String(student.class.id),
                  name: student.class.name,
                }
              : undefined,
          }
        : {
            id: String(record.studentId),
            fullName: '',
            studentCode: '',
            gender: 'MALE' as const,
            dateOfBirth: '',
          },
      measurementDate: record.measuredDate,
      ageInMonths,
      weightKg: Number(record.weightKg),
      heightCm: Number(record.heightCm),
      bmi,
      waz,
      haz,
      baz,
      weightClassification,
      heightClassification,
      bmiClassification,
      overallNutritionalStatus: overall,
      createdAt: record.measuredDate,
    };
  }

  async findAll(query: QueryGrowthRecordsDto, schoolId?: number) {
    const qb = this.growthRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.student', 'student')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('record.zscore', 'zscore');

    if (query.childId || query.studentId) {
      const cId = Number(query.childId || query.studentId);
      qb.andWhere('record.studentId = :cId', { cId });
    }

    if (query.classId) {
      qb.andWhere('student.classId = :classId', { classId: Number(query.classId) });
    }

    const status = query.status || query.nutritionalStatus;
    if (status) {
      qb.andWhere('zscore.classification = :status', { status });
    }

    if (query.search) {
      qb.andWhere(
        '(student.fullName ILIKE :search OR student.studentCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (schoolId) {
      qb.andWhere('class.schoolId = :schoolId', { schoolId });
    }

    qb.orderBy('record.measuredDate', 'DESC').addOrderBy('record.id', 'DESC');

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 50);
    qb.skip((page - 1) * limit).take(limit);

    const [records, total] = await qb.getManyAndCount();

    return {
      items: records.map((r) => this.mapToItem(r)),
      total,
    };
  }

  async getChildHistory(childId: number) {
    const child = await this.childRepo.findOne({
      where: { id: childId },
      relations: ['class'],
    });
    if (!child) {
      throw new NotFoundException(`Child with ID ${childId} not found`);
    }

    const records = await this.growthRepo.find({
      where: { studentId: childId },
      relations: ['student', 'student.class', 'zscore'],
      order: { measuredDate: 'ASC' },
    });

    const items = records.map((r) => this.mapToItem(r));
    const latest = items.length > 0 ? items[items.length - 1] : null;

    return {
      child: {
        id: String(child.id),
        fullName: child.fullName,
        studentCode: child.studentCode,
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
        class: child.class
          ? {
              id: String(child.class.id),
              name: child.class.name,
            }
          : null,
      },
      latest,
      history: items,
    };
  }

  async getClassOverview(classId: number) {
    const students = await this.childRepo.find({
      where: { classId },
      relations: ['class'],
    });

    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        evaluatedCount: 0,
        normalCount: 0,
        stuntedCount: 0,
        underweightCount: 0,
        overweightCount: 0,
        normalPercent: 0,
        stuntedPercent: 0,
        underweightPercent: 0,
        overweightPercent: 0,
      };
    }

    const studentIds = students.map((s) => s.id);
    const records = await this.growthRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.zscore', 'zscore')
      .where('record.student_id IN (:...studentIds)', { studentIds })
      .orderBy('record.measured_date', 'DESC')
      .getMany();

    // Map latest record per student
    const latestMap = new Map<number, GrowthRecord>();
    for (const r of records) {
      if (!latestMap.has(r.studentId)) {
        latestMap.set(r.studentId, r);
      }
    }

    let evaluatedCount = 0;
    let normalCount = 0;
    let stuntedCount = 0;
    let underweightCount = 0;
    let overweightCount = 0;

    for (const s of students) {
      const rec = latestMap.get(s.id);
      if (rec && rec.zscore) {
        evaluatedCount++;
        const cls = rec.zscore.classification;
        if (cls === 'NORMAL') normalCount++;
        else if (cls === 'STUNTED' || cls === 'SEVERELY_STUNTED') stuntedCount++;
        else if (cls === 'UNDERWEIGHT' || cls === 'SEVERELY_UNDERWEIGHT') underweightCount++;
        else if (cls === 'OVERWEIGHT' || cls === 'OBESE') overweightCount++;
        else normalCount++;
      }
    }

    const calcPct = (cnt: number) =>
      evaluatedCount > 0 ? Math.round((cnt / evaluatedCount) * 1000) / 10 : 0;

    return {
      totalStudents,
      evaluatedCount,
      normalCount,
      stuntedCount,
      underweightCount,
      overweightCount,
      normalPercent: calcPct(normalCount),
      stuntedPercent: calcPct(stuntedCount),
      underweightPercent: calcPct(underweightCount),
      overweightPercent: calcPct(overweightCount),
    };
  }

  async createRecord(dto: CreateGrowthRecordDto, measurerId?: number) {
    const studentId = Number(dto.studentId || dto.childId);
    const measuredDate = dto.measuredDate || dto.measurementDate || new Date().toISOString().split('T')[0];

    const child = await this.childRepo.findOne({
      where: { id: studentId },
      relations: ['class'],
    });
    if (!child) {
      throw new NotFoundException(`Child with ID ${studentId} not found`);
    }

    const gender = (child.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE';
    const growth = await this.whoService.calculateChildGrowth(
      gender,
      child.dateOfBirth,
      measuredDate,
      Number(dto.heightCm),
      Number(dto.weightKg),
    );

    let record = await this.growthRepo.findOne({
      where: { studentId, measuredDate },
      relations: ['zscore'],
    });

    if (record) {
      record.heightCm = Number(dto.heightCm);
      record.weightKg = Number(dto.weightKg);
      if (measurerId) record.measuredBy = measurerId;
      await this.growthRepo.save(record);
    } else {
      record = this.growthRepo.create({
        studentId,
        measuredDate,
        heightCm: Number(dto.heightCm),
        weightKg: Number(dto.weightKg),
        measuredBy: measurerId,
      });
      await this.growthRepo.save(record);
    }

    let zscore = await this.zscoreRepo.findOne({
      where: { measurementId: record.id },
    });

    if (zscore) {
      zscore.waz = growth.waz;
      zscore.haz = growth.haz;
      zscore.baz = growth.baz;
      zscore.classification = growth.classification;
      await this.zscoreRepo.save(zscore);
    } else {
      zscore = this.zscoreRepo.create({
        measurementId: record.id,
        waz: growth.waz,
        haz: growth.haz,
        baz: growth.baz,
        classification: growth.classification,
      });
      await this.zscoreRepo.save(zscore);
    }

    record.student = child;
    record.zscore = zscore;
    return this.mapToItem(record);
  }

  async updateRecord(id: number, dto: Partial<CreateGrowthRecordDto>) {
    const record = await this.growthRepo.findOne({
      where: { id },
      relations: ['student', 'student.class', 'zscore'],
    });
    if (!record) {
      throw new NotFoundException(`Growth record with ID ${id} not found`);
    }

    if (dto.heightCm != null) record.heightCm = Number(dto.heightCm);
    if (dto.weightKg != null) record.weightKg = Number(dto.weightKg);
    if (dto.measuredDate || dto.measurementDate) {
      record.measuredDate = dto.measuredDate || dto.measurementDate!;
    }

    const student = record.student;
    if (student) {
      const gender = (student.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as 'MALE' | 'FEMALE';
      const growth = await this.whoService.calculateChildGrowth(
        gender,
        student.dateOfBirth,
        record.measuredDate,
        Number(record.heightCm),
        Number(record.weightKg),
      );

      let zscore = record.zscore;
      if (!zscore) {
        zscore = this.zscoreRepo.create({ measurementId: record.id });
      }
      zscore.waz = growth.waz;
      zscore.haz = growth.haz;
      zscore.baz = growth.baz;
      zscore.classification = growth.classification;
      await this.zscoreRepo.save(zscore);
      record.zscore = zscore;
    }

    await this.growthRepo.save(record);
    return {
      success: true,
      message: 'Cập nhật chỉ số tăng trưởng thành công',
      data: this.mapToItem(record),
    };
  }

  async deleteRecord(id: number) {
    const record = await this.growthRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Growth record with ID ${id} not found`);
    }

    await this.zscoreRepo.delete({ measurementId: id });
    await this.growthRepo.delete(id);

    return {
      success: true,
      message: 'Xóa chỉ số tăng trưởng thành công',
    };
  }

  async importRecords(items: any[], measurerId?: number) {
    let importedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await this.createRecord(item, measurerId);
        importedCount++;
      } catch (err: any) {
        errors.push(`Lỗi dòng học sinh ${item.studentId || item.childId}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      errors,
    };
  }

  async exportReport(classId?: string) {
    const query: QueryGrowthRecordsDto = {
      classId,
      page: 1,
      limit: 1000,
    };
    const { items, total } = await this.findAll(query);
    return {
      totalRecords: total,
      items,
    };
  }
}
