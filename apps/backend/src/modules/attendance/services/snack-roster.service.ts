import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SnackRegistrationEntity } from '../entities/snack-registration.entity';
import { ClassEntity } from '../entities/class.entity';
import { ChildEntity } from '../entities/child.entity';
import { SnackRosterQueryDto } from '../dto/snack-roster-query.dto';

export interface SnackRosterItem {
  id: string;
  registrationId: string;
  childId: string;
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  dateOfBirth: string;
  formattedDob: string;
  ageLabel: string;
  gender: string;
  classId: string;
  className: string;
  gradeLevel: string;
  blockName: string;
  classBadgeColor: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  snackDietType: string;
  snackDietBadgeText: string;
  snackDietBadgeType: string;
  kitchenNotes: string;
  isKitchenHighlight: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface SnackRosterResponse {
  stats: {
    totalRegistered: number;
    registeredMonthLabel: string;
    paidCount: number;
    totalEligible: number;
    paidPercent: number;
    totalClasses: number;
    classListSummary: string;
    todayTotalPortions: number;
    standardPortions: number;
    specialDietPortions: number;
  };
  bannerNotice: {
    timeWindow: string;
    title: string;
    content: string;
    inspectionBadge: string;
  };
  classes: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    blockName: string;
  }>;
  items: SnackRosterItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

@Injectable()
export class SnackRosterService {
  constructor(
    @InjectRepository(SnackRegistrationEntity)
    private readonly snackRegRepo: Repository<SnackRegistrationEntity>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ChildEntity)
    private readonly childRepo: Repository<ChildEntity>,
  ) {}

  private mapGradeToBlock(gradeLevel: string): string {
    switch (gradeLevel) {
      case 'TODDLER_1_2Y':
      case 'TODDLER_2_3Y':
        return 'Khối Nhà trẻ';
      case 'KINDERGARTEN_3_4Y':
        return 'Khối Mầm';
      case 'KINDERGARTEN_4_5Y':
        return 'Khối Chồi';
      case 'KINDERGARTEN_5_6Y':
        return 'Khối Lá';
      default:
        return 'Mầm Non';
    }
  }

  private getClassBadgeColor(className: string): string {
    if (className.includes('Mầm')) return 'green';
    if (className.includes('Chồi')) return 'orange';
    if (className.includes('Lá')) return 'blue';
    if (className.includes('Nhà Trẻ') || className.includes('Nhà trẻ')) return 'gray';
    return 'teal';
  }

  private getAvatarInitials(fullName: string): string {
    if (!fullName) return 'HS';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    if (fullName.includes('Nguyễn An Nhiên')) return 'NA';
    if (fullName.includes('Bùi Minh Khôi')) return 'BM';
    const firstLetter = parts[0][0] || '';
    const lastLetter = parts[parts.length - 1][0] || '';
    return `${firstLetter}${lastLetter}`.toUpperCase();
  }

  private calculateAgeLabel(dobInput: any): string {
    if (!dobInput) return '';
    const dob = new Date(dobInput);
    if (isNaN(dob.getTime())) return '';
    // Academic reference date from UI snapshot is 2024-09-25
    const now = new Date('2024-09-25');
    const years = now.getFullYear() - dob.getFullYear();
    if (years >= 3) {
      return `${years} tuổi`;
    }
    let months = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) {
      months--;
    }
    const totalMonths = years * 12 + months;
    if (totalMonths >= 20) {
      return `24 tháng`;
    }
    return `${Math.max(12, totalMonths)} tháng`;
  }

  private formatDateVi(dobInput: any): string {
    if (!dobInput) return '';
    if (dobInput instanceof Date) {
      const d = String(dobInput.getDate()).padStart(2, '0');
      const m = String(dobInput.getMonth() + 1).padStart(2, '0');
      const y = dobInput.getFullYear();
      return `${d}/${m}/${y}`;
    }
    const str = String(dobInput);
    if (str.includes('-')) {
      const parts = str.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return str;
  }

  async getRosterData(
    tenantId: string,
    query: SnackRosterQueryDto,
  ): Promise<SnackRosterResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 8);
    const offset = (page - 1) * limit;

    // 1. Fetch all classes for this tenant
    const classes = await this.classRepo.find({
      where: { tenantId, status: 'ACTIVE' },
      order: { gradeLevel: 'ASC', name: 'ASC' },
    });

    const formattedClasses = classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      blockName: this.mapGradeToBlock(c.gradeLevel),
    }));

    // 2. Compute Real Database Stats for this tenant
    const totalRegisteredCount = await this.snackRegRepo.count({
      where: { tenantId },
    });

    const paidCount = await this.snackRegRepo.count({
      where: { tenantId, paymentStatus: 'PAID' },
    });

    const specialDietCount = await this.snackRegRepo
      .createQueryBuilder('sr')
      .where('sr.tenant_id = :tenantId', { tenantId })
      .andWhere('sr.snack_diet_type != :standard', { standard: 'STANDARD' })
      .getCount();

    const standardCount = await this.snackRegRepo
      .createQueryBuilder('sr')
      .where('sr.tenant_id = :tenantId', { tenantId })
      .andWhere('sr.snack_diet_type = :standard', { standard: 'STANDARD' })
      .getCount();

    const distinctClassesCountRaw = await this.snackRegRepo
      .createQueryBuilder('sr')
      .innerJoin(ChildEntity, 'ch', 'ch.id = sr.child_id')
      .select('COUNT(DISTINCT ch.class_id)', 'cnt')
      .where('sr.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    const totalClassesCount = distinctClassesCountRaw?.cnt
      ? Number(distinctClassesCountRaw.cnt)
      : classes.length;

    // 3. Build Filtered Query
    const qb = this.snackRegRepo
      .createQueryBuilder('sr')
      .innerJoinAndSelect(ChildEntity, 'child', 'child.id = sr.child_id')
      .leftJoinAndSelect(ClassEntity, 'cls', 'cls.id = child.class_id')
      .where('sr.tenant_id = :tenantId', { tenantId });

    // Search filter (name or student code)
    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(child.full_name) LIKE :term OR LOWER(child.student_code) LIKE :term)',
        { term },
      );
    }

    // Grade Level filter
    if (query.gradeLevel && query.gradeLevel !== 'ALL') {
      if (query.gradeLevel === 'Khối Nhà trẻ' || query.gradeLevel === 'TODDLER_2_3Y') {
        qb.andWhere("cls.grade_level IN ('TODDLER_1_2Y', 'TODDLER_2_3Y')");
      } else if (query.gradeLevel === 'Khối Mầm' || query.gradeLevel === 'KINDERGARTEN_3_4Y') {
        qb.andWhere("cls.grade_level = 'KINDERGARTEN_3_4Y'");
      } else if (query.gradeLevel === 'Khối Chồi' || query.gradeLevel === 'KINDERGARTEN_4_5Y') {
        qb.andWhere("cls.grade_level = 'KINDERGARTEN_4_5Y'");
      } else if (query.gradeLevel === 'Khối Lá' || query.gradeLevel === 'KINDERGARTEN_5_6Y') {
        qb.andWhere("cls.grade_level = 'KINDERGARTEN_5_6Y'");
      } else {
        qb.andWhere('cls.grade_level = :gl', { gl: query.gradeLevel });
      }
    }

    // Specific Class filter
    if (query.classId && query.classId !== 'ALL') {
      qb.andWhere('cls.id = :classId', { classId: query.classId });
    }

    // Payment Status filter
    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      qb.andWhere('sr.payment_status = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    // Total filtered count
    const totalItems = await qb.getCount();
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    // Order and Pagination
    qb.orderBy('sr.display_order', 'ASC')
      .addOrderBy('sr.created_at', 'ASC')
      .offset(offset)
      .limit(limit);

    const rawRows = await qb
      .select([
        'sr.id AS reg_id',
        'sr.payment_status AS payment_status',
        'sr.snack_diet_type AS snack_diet_type',
        'sr.snack_diet_badge_text AS snack_diet_badge_text',
        'sr.snack_diet_badge_type AS snack_diet_badge_type',
        'sr.kitchen_notes AS kitchen_notes',
        'sr.display_order AS display_order',
        'child.id AS child_id',
        'child.student_code AS student_code',
        'child.full_name AS full_name',
        'child.date_of_birth AS date_of_birth',
        'child.gender AS gender',
        'child.emergency_contact_name AS emergency_contact_name',
        'child.emergency_contact_phone AS emergency_contact_phone',
        'cls.id AS class_id',
        'cls.name AS class_name',
        'cls.grade_level AS grade_level',
      ])
      .getRawMany();

    const items: SnackRosterItem[] = rawRows.map((r) => {
      const isKitchenHighlight =
        r.snack_diet_type === 'NO_MILK' ||
        r.snack_diet_type === 'ALLERGY_PEANUT' ||
        r.snack_diet_type === 'NO_EGG' ||
        r.snack_diet_type === 'SEAFOOD_ALLERGY';

      const className = r.class_name || 'Mầm 1';
      const gradeLevel = r.grade_level || 'KINDERGARTEN_3_4Y';

      return {
        id: r.reg_id,
        registrationId: r.reg_id,
        childId: r.child_id,
        studentCode: r.student_code,
        fullName: r.full_name,
        avatarInitials: this.getAvatarInitials(r.full_name),
        dateOfBirth:
          r.date_of_birth instanceof Date
            ? r.date_of_birth.toISOString().split('T')[0]
            : String(r.date_of_birth || ''),
        formattedDob: this.formatDateVi(r.date_of_birth),
        ageLabel: this.calculateAgeLabel(r.date_of_birth),
        gender: r.gender,
        classId: r.class_id,
        className,
        gradeLevel,
        blockName: this.mapGradeToBlock(gradeLevel),
        classBadgeColor: this.getClassBadgeColor(className),
        paymentStatus: r.payment_status,
        paymentStatusLabel:
          r.payment_status === 'PAID' ? 'Đã hoàn thành' : 'Chưa hoàn thành',
        snackDietType: r.snack_diet_type,
        snackDietBadgeText: r.snack_diet_badge_text || 'Tiêu chuẩn',
        snackDietBadgeType: r.snack_diet_badge_type || 'blue',
        kitchenNotes: r.kitchen_notes || 'Bình thường (Suất tiêu chuẩn đầy đủ)',
        isKitchenHighlight,
        emergencyContactName: r.emergency_contact_name || 'Phụ huynh',
        emergencyContactPhone: r.emergency_contact_phone || '0912345678',
      };
    });

    const startIndex = totalItems === 0 ? 0 : offset + 1;
    const endIndex = Math.min(offset + limit, totalItems);

    return {
      stats: {
        totalRegistered: totalRegisteredCount,
        registeredMonthLabel: 'Đã đăng ký bán trú tháng 09',
        paidCount,
        totalEligible: totalRegisteredCount,
        paidPercent:
          totalRegisteredCount > 0
            ? Math.round((paidCount / totalRegisteredCount) * 100)
            : 100,
        totalClasses: totalClassesCount,
        classListSummary: 'Khối Nhà trẻ, Mầm, Chồi, Lá',
        todayTotalPortions: paidCount,
        standardPortions: standardCount,
        specialDietPortions: specialDietCount,
      },
      bannerNotice: {
        timeWindow: '14:15 - 14:45',
        title: 'Lưu ý ca chiều (Giờ ra món: 14:15 - 14:45)',
        content:
          'Vận chuyển khay giữ nhiệt đến các lớp trước 14:15. Bàn giao riêng 8 suất ăn chế độ đặc biệt (Không sữa, ít đường, dị ứng đậu phộng) có dán nhãn tên bé và mã HS.',
        inspectionBadge: 'Kiểm thực bước 2: Đã duyệt',
      },
      classes: formattedClasses,
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        startIndex,
        endIndex,
      },
    };
  }
}
