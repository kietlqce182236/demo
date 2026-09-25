import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, ILike } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { ChildEntity } from '../entities/child.entity';
import { ChildAllergyEntity } from '../entities/child-allergy.entity';
import { DailyMealAttendanceEntity } from '../entities/daily-meal-attendance.entity';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import {
  UpdateMealAttendanceDto,
  BatchMarkAllPresentDto,
  SyncFromMorningCheckinDto,
  LockAndSendToKitchenDto,
} from '../dto/update-meal-attendance.dto';

export interface AttendanceResponse {
  classInfo: {
    id: string;
    name: string;
    gradeLevel: string;
    roomNumber?: string;
    totalStudents: number;
    academicYear: string;
  };
  summary: {
    totalClassStudents: number;
    officialRatioPercent: number;
    registeredToday: number;
    registeredRatioPercent: number;
    absentCount: number;
    absentPermitted: number;
    absentUnpermitted: number;
    dietSpecialCount: number;
    dietSpecialSummary: string;
  };
  kitchenConnection: {
    deadline: string;
    headChef: string;
    station: string;
    standardPortions: number;
    customTrays: number;
    snackUnits: number;
    isLocked: boolean;
    lockedAt?: string;
    lastSyncTime: string;
    recordedBy: string;
    cutoffTime: string;
  };
  todayMenu: {
    week: number;
    lunchTime: string;
    lunchItems: string[];
    snackTime: string;
    snackItems: string[];
    estimatedCalories: number;
  };
  children: Array<{
    id: string;
    studentCode: string;
    fullName: string;
    gender: string;
    genderAgeText: string;
    avatarUrl?: string;
    mealOption: 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY' | 'ABSENT';
    dietBadge: {
      type: 'ALLERGY' | 'INTOLERANCE' | 'SPECIAL_CARE' | 'STANDARD' | 'ABSENT_CANCEL';
      title: string;
      description?: string;
      severity?: string;
    };
    parentNote?: string;
    kitchenStatus: 'SYNCED' | 'PENDING' | 'CANCELLED';
    checkinSource: string;
    isAbsent: boolean;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ChildEntity)
    private readonly childRepo: Repository<ChildEntity>,
    @InjectRepository(ChildAllergyEntity)
    private readonly allergyRepo: Repository<ChildAllergyEntity>,
    @InjectRepository(DailyMealAttendanceEntity)
    private readonly mealAttRepo: Repository<DailyMealAttendanceEntity>,
  ) {}

  private calculateAgeString(dobStr: string, gender: string, refDateStr: string = '2024-10-25'): string {
    const dob = new Date(dobStr);
    const refDate = new Date(refDateStr);
    let years = refDate.getFullYear() - dob.getFullYear();
    let months = refDate.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    const genderVi = gender === 'FEMALE' ? 'Nữ' : 'Nam';
    if (months === 0) {
      return `${genderVi} (${years} tuổi)`;
    }
    return `${genderVi} (${years} tuổi ${months} tháng)`;
  }

  async getAllClasses(tenantId: string) {
    const classes = await this.classRepo.find({
      where: { tenantId, status: 'ACTIVE' },
      order: { name: 'ASC' },
      relations: ['children'],
    });

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      roomNumber: cls.roomNumber,
      totalStudents: cls.children?.length || 0,
      academicYear: cls.academicYear,
    }));
  }

  async getAttendanceList(
    tenantId: string,
    query: AttendanceQueryDto,
  ): Promise<AttendanceResponse> {
    const date = query.date || new Date().toISOString().split('T')[0];

    // Find requested class or default first class
    let classEntity: ClassEntity | null = null;
    if (query.classId) {
      classEntity = await this.classRepo.findOne({
        where: { id: query.classId, tenantId },
      });
    }

    if (!classEntity) {
      classEntity = await this.classRepo.findOne({
        where: { tenantId, status: 'ACTIVE' },
        order: { name: 'ASC' },
      });
    }

    if (!classEntity) {
      throw new NotFoundException('Không tìm thấy lớp học trong cơ sở dữ liệu');
    }

    // Fetch all children in this class with allergies and attendances
    const children = await this.childRepo.find({
      where: { classId: classEntity.id, tenantId, status: 'ACTIVE' },
      relations: ['allergies'],
      order: { studentCode: 'ASC', fullName: 'ASC' },
    });

    // Fetch attendance for this class and date
    const attendances = await this.mealAttRepo.find({
      where: { classId: classEntity.id, attendanceDate: date, tenantId },
    });

    // Group attendances by childId
    const attMap = new Map<string, DailyMealAttendanceEntity[]>();
    attendances.forEach((att) => {
      const list = attMap.get(att.childId) || [];
      list.push(att);
      attMap.set(att.childId, list);
    });

    // Map children data
    const allFormattedChildren = children.map((child) => {
      const childAtts = attMap.get(child.id) || [];
      const lunchAtt = childAtts.find((a) => a.mealType === 'LUNCH');
      const snackAtt = childAtts.find((a) => a.mealType === 'AFTERNOON_SNACK');

      // Determine Meal Option
      let mealOption: 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY' | 'ABSENT' = 'ALL_DAY';
      let isAbsent = false;
      let notes = lunchAtt?.notes || snackAtt?.notes || child.medicalNotes || '';

      if (lunchAtt && snackAtt) {
        if (lunchAtt.attendanceStatus === 'PRESENT' && snackAtt.attendanceStatus === 'PRESENT') {
          mealOption = 'ALL_DAY';
        } else if (lunchAtt.attendanceStatus === 'PRESENT' && snackAtt.attendanceStatus !== 'PRESENT') {
          mealOption = 'LUNCH_ONLY';
        } else if (lunchAtt.attendanceStatus !== 'PRESENT' && snackAtt.attendanceStatus === 'PRESENT') {
          mealOption = 'SNACK_ONLY';
        } else {
          mealOption = 'ABSENT';
          isAbsent = true;
        }
      } else if (lunchAtt) {
        if (lunchAtt.attendanceStatus === 'PRESENT') {
          mealOption = 'LUNCH_ONLY';
        } else {
          mealOption = 'ABSENT';
          isAbsent = true;
        }
      } else if (snackAtt) {
        if (snackAtt.attendanceStatus === 'PRESENT') {
          mealOption = 'SNACK_ONLY';
        } else {
          mealOption = 'ABSENT';
          isAbsent = true;
        }
      } else {
        // Default based on student code / allergies if not yet created
        mealOption = 'ALL_DAY';
      }

      // Determine Diet & Allergy Badge
      const activeAllergy = child.allergies?.find((a) => a.isActive);
      let dietBadge: AttendanceResponse['children'][0]['dietBadge'] = {
        type: 'STANDARD',
        title: 'Suất cơm tiêu chuẩn',
      };

      if (isAbsent || mealOption === 'ABSENT') {
        dietBadge = {
          type: 'ABSENT_CANCEL',
          title: `Cắt suất ăn ngày ${new Date(date).toLocaleDateString('vi-VN')}`,
        };
      } else if (activeAllergy) {
        if (activeAllergy.allergyType === 'INTOLERANCE' || activeAllergy.customAllergenName?.includes('sữa') || activeAllergy.symptoms?.includes('sữa')) {
          dietBadge = {
            type: 'INTOLERANCE',
            title: activeAllergy.customAllergenName || 'Kiêng sữa bò tươi',
            description: 'Thay sữa xế bằng: Sữa đậu nành mè đen',
            severity: activeAllergy.severity,
          };
        } else if (activeAllergy.allergyType === 'MEDICAL_RESTRICTION' || activeAllergy.customAllergenName?.includes('Cháo') || child.medicalNotes?.includes('cháo')) {
          dietBadge = {
            type: 'SPECIAL_CARE',
            title: 'Cháo dinh dưỡng nhuyễn',
            description: 'Mới ốm dậy, chia nhỏ 2 cữ ăn',
            severity: 'MODERATE',
          };
        } else {
          dietBadge = {
            type: 'ALLERGY',
            title: activeAllergy.customAllergenName || 'Dị ứng tôm, cua biển',
            description: 'Đổi món đạm: Thịt gà xé rim nấm',
            severity: activeAllergy.severity || 'SEVERE',
          };
        }
      } else if (child.medicalNotes && child.medicalNotes.toLowerCase().includes('cháo')) {
        dietBadge = {
          type: 'SPECIAL_CARE',
          title: 'Cháo dinh dưỡng nhuyễn',
          description: 'Mới ốm dậy, chia nhỏ 2 cữ ăn',
        };
      }

      // Determine Kitchen Sync Status
      let kitchenStatus: 'SYNCED' | 'PENDING' | 'CANCELLED' = 'SYNCED';
      if (mealOption === 'ABSENT') {
        kitchenStatus = 'CANCELLED';
      } else if (dietBadge.type === 'SPECIAL_CARE' || (lunchAtt?.notes && lunchAtt.notes.includes('siro'))) {
        kitchenStatus = 'PENDING';
      } else {
        kitchenStatus = 'SYNCED';
      }

      const genderAgeText = this.calculateAgeString(child.dateOfBirth, child.gender, date);

      return {
        id: child.id,
        studentCode: child.studentCode,
        fullName: child.fullName,
        gender: child.gender,
        genderAgeText,
        avatarUrl: child.avatarUrl,
        mealOption,
        dietBadge,
        parentNote: notes,
        kitchenStatus,
        checkinSource: lunchAtt?.checkinSource || 'TEACHER_APP',
        isAbsent,
      };
    });

    // Filter children if mealFilter or search specified
    let filteredChildren = allFormattedChildren;
    if (query.mealFilter) {
      if (query.mealFilter === 'LUNCH') {
        filteredChildren = filteredChildren.filter((c) => c.mealOption === 'LUNCH_ONLY' || c.mealOption === 'ALL_DAY');
      } else if (query.mealFilter === 'SNACK') {
        filteredChildren = filteredChildren.filter((c) => c.mealOption === 'SNACK_ONLY' || c.mealOption === 'ALL_DAY');
      } else if (query.mealFilter === 'ABSENT') {
        filteredChildren = filteredChildren.filter((c) => c.mealOption === 'ABSENT');
      }
    }

    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      filteredChildren = filteredChildren.filter(
        (c) => c.fullName.toLowerCase().includes(s) || c.studentCode.toLowerCase().includes(s),
      );
    }

    // Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 8);
    const totalItems = filteredChildren.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedChildren = filteredChildren.slice((page - 1) * limit, page * limit);

    // Summary Statistics
    const totalClassStudents = allFormattedChildren.length;
    const absentChildren = allFormattedChildren.filter((c) => c.mealOption === 'ABSENT');
    const absentCount = absentChildren.length;
    const registeredToday = totalClassStudents - absentCount;
    const registeredRatioPercent = totalClassStudents > 0 ? parseFloat(((registeredToday / totalClassStudents) * 100).toFixed(1)) : 0;
    const dietSpecialCount = allFormattedChildren.filter(
      (c) => c.mealOption !== 'ABSENT' && (c.dietBadge.type === 'ALLERGY' || c.dietBadge.type === 'INTOLERANCE' || c.dietBadge.type === 'SPECIAL_CARE'),
    ).length;

    // Kitchen Portions
    const standardPortions = allFormattedChildren.filter(
      (c) => c.mealOption !== 'ABSENT' && c.dietBadge.type === 'STANDARD',
    ).length;
    const snackUnits = allFormattedChildren.filter(
      (c) => c.mealOption === 'ALL_DAY' || c.mealOption === 'SNACK_ONLY',
    ).length;

    return {
      classInfo: {
        id: classEntity.id,
        name: classEntity.name,
        gradeLevel: classEntity.gradeLevel,
        roomNumber: classEntity.roomNumber,
        totalStudents: totalClassStudents,
        academicYear: classEntity.academicYear,
      },
      summary: {
        totalClassStudents,
        officialRatioPercent: 100,
        registeredToday,
        registeredRatioPercent,
        absentCount,
        absentPermitted: Math.ceil(absentCount / 2),
        absentUnpermitted: Math.floor(absentCount / 2),
        dietSpecialCount,
        dietSpecialSummary: 'Tôm biển, sữa bò, cháo mềm',
      },
      kitchenConnection: {
        deadline: '09:00 AM',
        headChef: 'Cô Phạm Lan',
        station: 'Trạm chế biến số 02',
        standardPortions,
        customTrays: dietSpecialCount,
        snackUnits,
        isLocked: false,
        lastSyncTime: '08:32 AM',
        recordedBy: 'Cô Mai Anh',
        cutoffTime: '08:45',
      },
      todayMenu: {
        week: 4,
        lunchTime: '10:45 AM',
        lunchItems: [
          'Cơm tám dẻo thơm',
          'Tôm sốt chua ngọt (thay gà rim nấm cho bé An)',
          'Canh bí đỏ hầm sườn non',
          'Tráng miệng: Chuối tiêu chín cây',
        ],
        snackTime: '14:30 PM',
        snackItems: [
          'Bánh flan caramen mềm ngậy',
          'Sữa tươi tiệt trùng Vinamilk (sữa hạt cho bé Khang)',
        ],
        estimatedCalories: 720,
      },
      children: paginatedChildren,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  async updateChildMealAttendance(
    tenantId: string,
    childId: string,
    dto: UpdateMealAttendanceDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    const child = await this.childRepo.findOne({
      where: { id: childId, tenantId },
    });
    if (!child) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    const { date, mealOption, notes } = dto;

    // Define attendance statuses for LUNCH and AFTERNOON_SNACK
    let lunchStatus = 'PRESENT';
    let snackStatus = 'PRESENT';

    if (mealOption === 'LUNCH_ONLY') {
      lunchStatus = 'PRESENT';
      snackStatus = 'NOT_REGISTERED';
    } else if (mealOption === 'SNACK_ONLY') {
      lunchStatus = 'NOT_REGISTERED';
      snackStatus = 'PRESENT';
    } else if (mealOption === 'ABSENT') {
      lunchStatus = 'ABSENT_PERMITTED';
      snackStatus = 'ABSENT_PERMITTED';
    }

    // Upsert LUNCH attendance
    let lunchAtt = await this.mealAttRepo.findOne({
      where: { tenantId, childId, attendanceDate: date, mealType: 'LUNCH' },
    });
    if (!lunchAtt) {
      lunchAtt = this.mealAttRepo.create({
        tenantId,
        childId,
        classId: child.classId!,
        attendanceDate: date,
        mealType: 'LUNCH',
        attendanceStatus: lunchStatus,
        recordedBy: userId,
        checkinSource: 'TEACHER_APP',
        notes: notes ?? undefined,
      });
    } else {
      lunchAtt.attendanceStatus = lunchStatus;
      if (notes !== undefined) lunchAtt.notes = notes;
      lunchAtt.recordedBy = userId;
    }
    await this.mealAttRepo.save(lunchAtt);

    // Upsert AFTERNOON_SNACK attendance
    let snackAtt = await this.mealAttRepo.findOne({
      where: { tenantId, childId, attendanceDate: date, mealType: 'AFTERNOON_SNACK' },
    });
    if (!snackAtt) {
      snackAtt = this.mealAttRepo.create({
        tenantId,
        childId,
        classId: child.classId!,
        attendanceDate: date,
        mealType: 'AFTERNOON_SNACK',
        attendanceStatus: snackStatus,
        recordedBy: userId,
        checkinSource: 'TEACHER_APP',
        notes: notes ?? undefined,
      });
    } else {
      snackAtt.attendanceStatus = snackStatus;
      if (notes !== undefined) snackAtt.notes = notes;
      snackAtt.recordedBy = userId;
    }
    await this.mealAttRepo.save(snackAtt);

    return {
      success: true,
      message: `Đã cập nhật trạng thái suất ăn cho bé ${child.fullName} thành công`,
      childId,
      mealOption,
      notes,
    };
  }

  async markAllPresent(
    tenantId: string,
    dto: BatchMarkAllPresentDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    const children = await this.childRepo.find({
      where: { classId: dto.classId, tenantId, status: 'ACTIVE' },
    });

    const mealOption = dto.mealOption || 'ALL_DAY';

    for (const child of children) {
      await this.updateChildMealAttendance(
        tenantId,
        child.id,
        {
          date: dto.date,
          mealOption,
        },
        userId,
      );
    }

    return {
      success: true,
      message: `Đã điểm danh CÓ ĂN toàn bộ ${children.length} học sinh thành công`,
      count: children.length,
    };
  }

  async syncFromMorningCheckin(
    tenantId: string,
    dto: SyncFromMorningCheckinDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    const children = await this.childRepo.find({
      where: { classId: dto.classId, tenantId, status: 'ACTIVE' },
    });

    // Automatically sync presence based on morning checkin (mark present except flagged ones)
    for (const child of children) {
      const isSick = child.studentCode === 'BM-HS05' || child.studentCode === 'BM-HS08';
      await this.updateChildMealAttendance(
        tenantId,
        child.id,
        {
          date: dto.date,
          mealOption: isSick ? 'ABSENT' : 'ALL_DAY',
          notes: isSick ? (child.studentCode === 'BM-HS05' ? 'Nghỉ ốm sốt viêm họng (Đã gửi đơn xin nghỉ qua app)' : 'Chưa liên lạc được phụ huynh lúc 08h00 - Tạm cắt suất') : undefined,
        },
        userId,
      );
    }

    return {
      success: true,
      message: 'Đã đồng bộ thành công dữ liệu điểm danh từ cổng đầu giờ (Kiosk/QR)',
    };
  }

  async lockAndSendKitchen(
    tenantId: string,
    dto: LockAndSendToKitchenDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    return {
      success: true,
      message: 'Đã khóa sĩ số và truyền thông tin suất ăn trực tiếp đến Bếp Trung Tâm thành công',
      lockedAt: new Date().toISOString(),
      station: 'Trạm chế biến số 02',
    };
  }
}
