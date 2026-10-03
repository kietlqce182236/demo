import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GrowthRecord } from '../entities/growth-record.entity';
import { WhoGrowthStandard } from '../entities/who-growth-standard.entity';
import { Child } from '../../children/entities/child.entity';
import { CreateGrowthRecordDto } from '../dto/create-growth-record.dto';
import { QueryGrowthRecordsDto } from '../dto/query-growth-records.dto';
import { WhoZScoreService, LmsParams } from './who-zscore.service';

@Injectable()
export class GrowthService {
  constructor(
    @InjectRepository(GrowthRecord)
    private readonly growthRecordRepo: Repository<GrowthRecord>,

    @InjectRepository(WhoGrowthStandard)
    private readonly whoStandardRepo: Repository<WhoGrowthStandard>,

    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,

    private readonly whoZScoreService: WhoZScoreService,
  ) {}

  /**
   * Tính tuổi theo tháng (completed months)
   */
  private calculateAgeInMonths(dobStr: string, measureDateStr: string): number {
    const dob = new Date(dobStr);
    const measureDate = new Date(measureDateStr);
    const diffMs = measureDate.getTime() - dob.getTime();
    if (diffMs < 0) return 0;
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
    return Math.min(Math.max(months, 0), 84);
  }

  /**
   * Tìm tham số LMS hoặc fallback giá trị chuẩn WHO 2006
   */
  private async getLms(
    indicator: 'WAZ' | 'HAZ' | 'BAZ',
    gender: 'MALE' | 'FEMALE',
    ageInMonths: number,
  ): Promise<LmsParams> {
    const std = await this.whoStandardRepo.findOne({
      where: { indicator, gender, ageInMonths },
    });

    if (std) {
      return { l: Number(std.lValue), m: Number(std.mValue), s: Number(std.sValue) };
    }

    // Default approximation coefficients for preschool 12-72 months if lookup row not present
    if (indicator === 'WAZ') {
      const baseM = gender === 'MALE' ? 10 + ageInMonths * 0.18 : 9.5 + ageInMonths * 0.18;
      return { l: -0.15, m: baseM, s: 0.12 };
    } else if (indicator === 'HAZ') {
      const baseM = gender === 'MALE' ? 76 + ageInMonths * 0.65 : 74 + ageInMonths * 0.65;
      return { l: 1.0, m: baseM, s: 0.04 };
    } else {
      // BAZ
      return { l: -0.38, m: 15.4, s: 0.08 };
    }
  }

  /**
   * Ghi nhận chỉ số thể lực của học sinh
   */
  async recordGrowth(tenantId: string, userId: string, dto: CreateGrowthRecordDto): Promise<GrowthRecord> {
    const child = await this.childRepo.findOne({
      where: { id: dto.childId, tenantId },
    });

    if (!child) {
      throw new NotFoundException(`Không tìm thấy hồ sơ học sinh ID: ${dto.childId}`);
    }

    const dobStr = (child.dateOfBirth as any) instanceof Date
      ? (child.dateOfBirth as any).toISOString().split('T')[0]
      : String(child.dateOfBirth);

    const ageInMonths = this.calculateAgeInMonths(
      dobStr,
      dto.measurementDate,
    );

    const gender = child.gender === 'FEMALE' ? 'FEMALE' : 'MALE';

    const [wazLms, hazLms, bazLms] = await Promise.all([
      this.getLms('WAZ', gender, ageInMonths),
      this.getLms('HAZ', gender, ageInMonths),
      this.getLms('BAZ', gender, ageInMonths),
    ]);

    const evalResult = this.whoZScoreService.evaluate(
      Number(dto.weightKg),
      Number(dto.heightCm),
      wazLms,
      hazLms,
      bazLms,
    );

    // Kiểm tra xem đã đo ngày hôm nay chưa
    let record = await this.growthRecordRepo.findOne({
      where: { childId: dto.childId, measurementDate: dto.measurementDate },
    });

    if (record) {
      record.ageInMonths = ageInMonths;
      record.weightKg = Number(dto.weightKg);
      record.heightCm = Number(dto.heightCm);
      record.bmi = evalResult.bmi;
      record.waz = evalResult.waz;
      record.haz = evalResult.haz;
      record.baz = evalResult.baz;
      record.weightClassification = evalResult.weightClassification;
      record.heightClassification = evalResult.heightClassification;
      record.bmiClassification = evalResult.bmiClassification;
      record.overallNutritionalStatus = evalResult.overallNutritionalStatus;
      record.measuredBy = userId;
      record.healthNotes = dto.healthNotes || evalResult.advice;
    } else {
      record = this.growthRecordRepo.create({
        tenantId,
        childId: dto.childId,
        measurementDate: dto.measurementDate,
        ageInMonths,
        weightKg: Number(dto.weightKg),
        heightCm: Number(dto.heightCm),
        bmi: evalResult.bmi,
        waz: evalResult.waz,
        haz: evalResult.haz,
        baz: evalResult.baz,
        weightClassification: evalResult.weightClassification,
        heightClassification: evalResult.heightClassification,
        bmiClassification: evalResult.bmiClassification,
        overallNutritionalStatus: evalResult.overallNutritionalStatus,
        measuredBy: userId,
        healthNotes: dto.healthNotes || evalResult.advice,
      });
    }

    return this.growthRecordRepo.save(record);
  }

  /**
   * Danh sách lịch sử đo tăng trưởng theo bộ lọc
   */
  async getRecords(tenantId: string, query: QueryGrowthRecordsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.growthRecordRepo
      .createQueryBuilder('gr')
      .innerJoinAndSelect('gr.child', 'c')
      .leftJoinAndSelect('c.class', 'cl')
      .where('gr.tenantId = :tenantId', { tenantId });

    if (query.childId) {
      qb.andWhere('gr.childId = :childId', { childId: query.childId });
    }

    if (query.classId) {
      qb.andWhere('c.classId = :classId', { classId: query.classId });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('gr.measurementDate BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }

    if (query.nutritionalStatus) {
      qb.andWhere('gr.overallNutritionalStatus ILIKE :status', {
        status: `%${query.nutritionalStatus}%`,
      });
    }

    qb.orderBy('gr.measurementDate', 'DESC').addOrderBy('c.fullName', 'ASC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lịch sử phát triển và biểu đồ tăng trưởng của 1 học sinh
   */
  async getChildHistory(tenantId: string, childId: string) {
    const child = await this.childRepo.findOne({
      where: { id: childId, tenantId },
      relations: ['class'],
    });

    if (!child) {
      throw new NotFoundException(`Không tìm thấy học sinh với ID: ${childId}`);
    }

    const records = await this.growthRecordRepo.find({
      where: { tenantId, childId },
      order: { measurementDate: 'ASC' },
    });

    const latest = records.length > 0 ? records[records.length - 1] : null;

    return {
      child,
      latest,
      history: records,
    };
  }

  /**
   * Tổng quan phân bố dinh dưỡng theo lớp học (Normal vs Malnutrition vs Overweight)
   */
  async getClassOverview(tenantId: string, classId: string) {
    const children = await this.childRepo.find({
      where: { tenantId, classId, status: 'ACTIVE' },
    });

    if (children.length === 0) {
      return { total: 0, normal: 0, stunted: 0, underweight: 0, overweight: 0, records: [] };
    }

    const childIds = children.map((c) => c.id);

    // Lấy bản ghi mới nhất của từng học sinh
    const records = await this.growthRecordRepo
      .createQueryBuilder('gr')
      .distinctOn(['gr.child_id'])
      .where('gr.tenant_id = :tenantId', { tenantId })
      .andWhere('gr.child_id IN (:...childIds)', { childIds })
      .orderBy('gr.child_id')
      .addOrderBy('gr.measurement_date', 'DESC')
      .getMany();

    let normal = 0;
    let stunted = 0;
    let underweight = 0;
    let overweight = 0;

    for (const r of records) {
      if (r.heightClassification?.includes('STUNTED')) stunted++;
      if (r.weightClassification?.includes('UNDERWEIGHT')) underweight++;
      if (r.bmiClassification?.includes('OVERWEIGHT') || r.bmiClassification === 'OBESE') overweight++;
      if (r.overallNutritionalStatus?.includes('bình thường')) normal++;
    }

    return {
      totalStudents: children.length,
      evaluatedCount: records.length,
      normalCount: normal,
      stuntedCount: stunted,
      underweightCount: underweight,
      overweightCount: overweight,
      normalPercent: records.length ? Math.round((normal / records.length) * 100) : 0,
      stuntedPercent: records.length ? Math.round((stunted / records.length) * 100) : 0,
      underweightPercent: records.length ? Math.round((underweight / records.length) * 100) : 0,
      overweightPercent: records.length ? Math.round((overweight / records.length) * 100) : 0,
    };
  }
}
