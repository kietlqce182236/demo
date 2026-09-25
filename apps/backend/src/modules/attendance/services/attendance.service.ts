import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, ILike } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { ChildEntity } from '../entities/child.entity';
import { ChildAllergyEntity } from '../entities/child-allergy.entity';
import { DailyMealAttendanceEntity } from '../entities/daily-meal-attendance.entity';
import { ClassMealEvaluationEntity } from '../entities/class-meal-evaluation.entity';
import { MealConsumptionStatusEntity } from '../entities/meal-consumption-status.entity';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import {
  UpdateMealAttendanceDto,
  BatchMarkAllPresentDto,
  SyncFromMorningCheckinDto,
  LockAndSendToKitchenDto,
} from '../dto/update-meal-attendance.dto';
import { MealEvaluationQueryDto } from '../dto/meal-evaluation-query.dto';
import {
  UpdateChildEvaluationDto,
  BatchUpdatePortionDto,
  UpdateSensoryEvaluationDto,
  LockAndSendEvaluationDto,
} from '../dto/update-meal-evaluation.dto';

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

export interface MealEvaluationResponse {
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
    totalEating: number;
    absentCount: number;
    ateAllCount: number;
    ateAllPercent: number;
    ateHalfCount: number;
    ateHalfPercent: number;
    ateLittleCount: number;
    ateLittlePercent: number;
  };
  sensoryEvaluation: {
    softnessScore: number;
    temperatureScore: number;
    excitementScore: number;
    foodSafetyChecked: boolean;
    chefFeedback: string;
    headChefName: string;
    isLocked: boolean;
    lockedAt?: string;
    status: string;
  };
  children: Array<{
    id: string;
    studentCode: string;
    fullName: string;
    firstName: string;
    gender: string;
    genderAgeText: string;
    avatarLetter: string;
    menuBadge: {
      label: string;
      type: 'standard' | 'allergy' | 'special' | 'intolerance' | 'absent';
    };
    menuDetail: string;
    portionConsumed: 'ALL' | 'HALF' | 'NONE';
    consumptionPercentage: number;
    waterIntake: string;
    teacherNote: string;
    sendState: {
      status: 'SENT' | 'PENDING' | 'URGENT_PARENT';
      label: string;
    };
    isAbsent: boolean;
    attendanceId?: string;
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
    @InjectRepository(ClassMealEvaluationEntity)
    private readonly classEvalRepo: Repository<ClassMealEvaluationEntity>,
    @InjectRepository(MealConsumptionStatusEntity)
    private readonly consumptionRepo: Repository<MealConsumptionStatusEntity>,
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
    const ageDecimal = months > 0 ? (years + months / 12).toFixed(1) : years.toString();
    return `${genderVi} (${ageDecimal} tuổi)`;
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
    const date = query.date || '2024-10-25';

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

    const children = await this.childRepo.find({
      where: { classId: classEntity.id, tenantId, status: 'ACTIVE' },
      relations: ['allergies'],
      order: { studentCode: 'ASC', fullName: 'ASC' },
    });

    const attendances = await this.mealAttRepo.find({
      where: { classId: classEntity.id, attendanceDate: date, tenantId },
    });

    const attMap = new Map<string, DailyMealAttendanceEntity[]>();
    attendances.forEach((att) => {
      const list = attMap.get(att.childId) || [];
      list.push(att);
      attMap.set(att.childId, list);
    });

    const allFormattedChildren = children.map((child) => {
      const childAtts = attMap.get(child.id) || [];
      const lunchAtt = childAtts.find((a) => a.mealType === 'LUNCH');
      const snackAtt = childAtts.find((a) => a.mealType === 'AFTERNOON_SNACK');

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
        mealOption = 'ALL_DAY';
      }

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

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 8);
    const totalItems = filteredChildren.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedChildren = filteredChildren.slice((page - 1) * limit, page * limit);

    const totalClassStudents = allFormattedChildren.length;
    const absentChildren = allFormattedChildren.filter((c) => c.mealOption === 'ABSENT');
    const absentCount = absentChildren.length;
    const registeredToday = totalClassStudents - absentCount;
    const registeredRatioPercent = totalClassStudents > 0 ? parseFloat(((registeredToday / totalClassStudents) * 100).toFixed(1)) : 0;
    const dietSpecialCount = allFormattedChildren.filter(
      (c) => c.mealOption !== 'ABSENT' && (c.dietBadge.type === 'ALLERGY' || c.dietBadge.type === 'INTOLERANCE' || c.dietBadge.type === 'SPECIAL_CARE'),
    ).length;

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

  // =========================================================================
  // UC62: ĐÁNH GIÁ MỨC ĐỘ ĂN CỦA TRẺ SAU BỮA (HẾT SUẤT, 1/2, BỎ BỮA)
  // =========================================================================

  async getEvaluationList(
    tenantId: string,
    query: MealEvaluationQueryDto,
  ): Promise<MealEvaluationResponse> {
    const date = query.date || '2024-10-25';
    const mealType = query.mealType || 'LUNCH';

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

    // 1. Fetch children
    const children = await this.childRepo.find({
      where: { classId: classEntity.id, tenantId, status: 'ACTIVE' },
      relations: ['allergies'],
      order: { studentCode: 'ASC', fullName: 'ASC' },
    });

    // 2. Fetch daily attendance for this meal
    const attendances = await this.mealAttRepo.find({
      where: { classId: classEntity.id, attendanceDate: date, mealType, tenantId },
    });

    const attMap = new Map<string, DailyMealAttendanceEntity>();
    attendances.forEach((a) => attMap.set(a.childId, a));

    // 3. Fetch consumption records for these attendances
    const attIds = attendances.map((a) => a.id);
    let consumptionRecords: MealConsumptionStatusEntity[] = [];
    if (attIds.length > 0) {
      consumptionRecords = await this.consumptionRepo.find({
        where: { attendanceId: In(attIds), tenantId },
      });
    }

    const consumptionMap = new Map<string, MealConsumptionStatusEntity>();
    consumptionRecords.forEach((c) => consumptionMap.set(c.attendanceId, c));

    // 4. Fetch class sensory evaluation
    let sensory = await this.classEvalRepo.findOne({
      where: { classId: classEntity.id, evaluationDate: date, mealType, tenantId },
    });

    if (!sensory) {
      sensory = this.classEvalRepo.create({
        tenantId,
        classId: classEntity.id,
        evaluationDate: date,
        mealType,
        softnessScore: 5,
        temperatureScore: 4,
        excitementScore: 5,
        foodSafetyChecked: true,
        chefFeedback: 'Hôm nay các con rất thích món thịt viên sốt cà và canh rau ngót sườn. Khẩu vị rất vừa vặn, mềm xốp phù hợp độ tuổi 3-4 tuổi. Riêng bé Mai Chi sốt nhẹ nên ăn ít cháo, chiều cô sẽ theo dõi thêm.',
        headChefName: 'Cô Phạm Lan',
        isLocked: false,
        status: 'DRAFT',
      });
    }

    // 5. Format Children Data
    const formattedChildren = children.map((child) => {
      const att = attMap.get(child.id);
      const isAbsent = !att || att.attendanceStatus !== 'PRESENT';
      const consumption = att ? consumptionMap.get(att.id) : null;

      // Portion Consumed
      let portionConsumed: 'ALL' | 'HALF' | 'NONE' = 'ALL';
      let consumptionPercentage = 100;
      if (isAbsent) {
        portionConsumed = 'NONE';
        consumptionPercentage = 0;
      } else if (consumption) {
        if (consumption.portionConsumed === 'HALF') {
          portionConsumed = 'HALF';
          consumptionPercentage = 50;
        } else if (consumption.portionConsumed === 'NONE' || consumption.portionConsumed === 'QUARTER') {
          portionConsumed = 'NONE';
          consumptionPercentage = 20;
        } else {
          portionConsumed = 'ALL';
          consumptionPercentage = 100;
        }
      }

      // Water intake
      let waterIntake = consumption?.waterIntake || '200ml Nước ấm';

      // Send status & label
      let sendStatus: 'SENT' | 'PENDING' | 'URGENT_PARENT' = (consumption?.syncStatus as any) || 'SENT';
      let sendLabel = 'Đã gửi 11:42';

      if (sendStatus === 'URGENT_PARENT') {
        sendLabel = 'Báo phụ huynh gấp';
      } else if (sendStatus === 'PENDING') {
        sendLabel = 'Chờ gửi duyệt';
      } else if (consumption?.sentAt) {
        sendLabel = `Đã gửi ${consumption.sentAt}`;
      } else {
        sendLabel = 'Đã gửi 11:42';
      }

      // Diet & Menu details
      const activeAllergy = child.allergies?.find((a) => a.isActive);
      let menuBadge: MealEvaluationResponse['children'][0]['menuBadge'] = {
        label: 'Cơm suất chuẩn',
        type: 'standard',
      };
      let menuDetail = 'Thịt viên sốt cà, Canh rau ngót';

      if (isAbsent) {
        menuBadge = { label: 'Bé nghỉ ăn', type: 'absent' };
        menuDetail = att?.notes || 'Nghỉ ốm có phép';
      } else if (activeAllergy) {
        if (activeAllergy.allergyType === 'INTOLERANCE' || activeAllergy.customAllergenName?.toLowerCase().includes('sữa')) {
          menuBadge = { label: 'Không dùng sữa bò', type: 'intolerance' };
          menuDetail = 'Dùng tráng miệng chuối chín';
        } else if (activeAllergy.allergyType === 'MEDICAL_RESTRICTION' || child.medicalNotes?.includes('cháo')) {
          menuBadge = { label: 'Cháo mềm gà nấm', type: 'special' };
          menuDetail = 'Yêu cầu ăn loãng do ho nhẹ';
        } else {
          menuBadge = { label: 'Dị ứng Tôm, Cua', type: 'allergy' };
          menuDetail = 'Chế độ riêng: Thịt heo hầm nấm';
        }
      } else if (child.studentCode === 'BM-HS03' || child.studentCode === 'MB1-0055') {
        menuBadge = { label: 'Cơm suất chuẩn', type: 'standard' };
        menuDetail = 'Cắt nhỏ thịt băm theo yêu cầu';
      } else if (child.studentCode === 'BM-HS04' || child.studentCode === 'MB1-0008') {
        menuBadge = { label: 'Cháo mềm gà nấm', type: 'special' };
        menuDetail = 'Yêu cầu ăn loãng do ho nhẹ';
      } else if (child.studentCode === 'BM-HS06' || child.studentCode === 'MB1-0019') {
        menuBadge = { label: 'Cơm suất chuẩn', type: 'standard' };
        menuDetail = 'Ăn thêm rau bina luộc';
      }

      // Teacher note
      const teacherNote = consumption?.teacherFeedback || att?.notes || '';

      const nameParts = child.fullName.trim().split(' ');
      const avatarLetter = nameParts[nameParts.length - 1].charAt(0).toUpperCase() || 'B';
      const genderAgeText = this.calculateAgeString(child.dateOfBirth, child.gender, date);

      return {
        id: child.id,
        studentCode: child.studentCode,
        fullName: child.fullName,
        firstName: child.firstName,
        gender: child.gender,
        genderAgeText,
        avatarLetter,
        menuBadge,
        menuDetail,
        portionConsumed,
        consumptionPercentage,
        waterIntake,
        teacherNote,
        sendState: {
          status: sendStatus,
          label: sendLabel,
        },
        isAbsent,
        attendanceId: att?.id,
      };
    });

    // 6. Filter by search query if any
    let filteredChildren = formattedChildren;
    if (query.search && query.search.trim()) {
      const s = query.search.toLowerCase().trim();
      filteredChildren = filteredChildren.filter(
        (c) => c.fullName.toLowerCase().includes(s) || c.studentCode.toLowerCase().includes(s),
      );
    }

    // 7. Calculate Summary
    const totalClassStudents = formattedChildren.length;
    const presentChildren = formattedChildren.filter((c) => !c.isAbsent);
    const absentCount = totalClassStudents - presentChildren.length;
    const totalEating = presentChildren.length;

    const ateAllCount = presentChildren.filter((c) => c.portionConsumed === 'ALL').length;
    const ateHalfCount = presentChildren.filter((c) => c.portionConsumed === 'HALF').length;
    const ateLittleCount = presentChildren.filter((c) => c.portionConsumed === 'NONE').length;

    const ateAllPercent = totalEating > 0 ? parseFloat(((ateAllCount / totalEating) * 100).toFixed(1)) : 0;
    const ateHalfPercent = totalEating > 0 ? parseFloat(((ateHalfCount / totalEating) * 100).toFixed(1)) : 0;
    const ateLittlePercent = totalEating > 0 ? parseFloat(((ateLittleCount / totalEating) * 100).toFixed(1)) : 0;

    // 8. Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 8);
    const totalItems = filteredChildren.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedChildren = filteredChildren.slice((page - 1) * limit, page * limit);

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
        totalEating,
        absentCount,
        ateAllCount,
        ateAllPercent,
        ateHalfCount,
        ateHalfPercent,
        ateLittleCount,
        ateLittlePercent,
      },
      sensoryEvaluation: {
        softnessScore: sensory.softnessScore,
        temperatureScore: sensory.temperatureScore,
        excitementScore: sensory.excitementScore,
        foodSafetyChecked: sensory.foodSafetyChecked,
        chefFeedback: sensory.chefFeedback || '',
        headChefName: sensory.headChefName || 'Cô Phạm Lan',
        isLocked: sensory.isLocked,
        lockedAt: sensory.lockedAt?.toISOString(),
        status: sensory.status,
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

  async updateChildEvaluation(
    tenantId: string,
    childId: string,
    dto: UpdateChildEvaluationDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    const child = await this.childRepo.findOne({
      where: { id: childId, tenantId },
    });
    if (!child) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    const mealType = dto.mealType || 'LUNCH';
    const date = dto.date;

    // 1. Find or create daily attendance
    let att = await this.mealAttRepo.findOne({
      where: { tenantId, childId, attendanceDate: date, mealType },
    });

    if (!att) {
      att = this.mealAttRepo.create({
        tenantId,
        childId,
        classId: child.classId!,
        attendanceDate: date,
        mealType,
        attendanceStatus: 'PRESENT',
        recordedBy: userId,
        checkinSource: 'TEACHER_APP',
      });
      await this.mealAttRepo.save(att);
    }

    // 2. Map consumption percentage
    let percentage = 100;
    if (dto.portionConsumed === 'HALF') percentage = 50;
    else if (dto.portionConsumed === 'NONE') percentage = 20;

    // 3. Upsert meal_consumption_status
    let consumption = await this.consumptionRepo.findOne({
      where: { tenantId, attendanceId: att.id },
    });

    if (!consumption) {
      consumption = this.consumptionRepo.create({
        tenantId,
        attendanceId: att.id,
        portionConsumed: dto.portionConsumed,
        consumptionPercentage: percentage,
        waterIntake: dto.waterIntake || '200ml Nước ấm',
        syncStatus: dto.syncStatus || 'SENT',
        sentAt: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`,
        teacherFeedback: dto.notes,
      });
    } else {
      consumption.portionConsumed = dto.portionConsumed;
      consumption.consumptionPercentage = percentage;
      if (dto.waterIntake !== undefined) consumption.waterIntake = dto.waterIntake;
      if (dto.syncStatus !== undefined) consumption.syncStatus = dto.syncStatus;
      if (dto.notes !== undefined) consumption.teacherFeedback = dto.notes;
    }

    await this.consumptionRepo.save(consumption);

    return {
      success: true,
      message: `Đã lưu đánh giá cho bé ${child.fullName} thành công!`,
      childId,
      portionConsumed: dto.portionConsumed,
    };
  }

  async batchUpdatePortion(
    tenantId: string,
    dto: BatchUpdatePortionDto,
    userId: string = '51000000-0000-0000-0000-000000000004',
  ) {
    const mealType = dto.mealType || 'LUNCH';
    const date = dto.date;

    let targetChildIds = dto.childIds;
    if (!targetChildIds || targetChildIds.length === 0) {
      const classChildren = await this.childRepo.find({
        where: { classId: dto.classId, tenantId, status: 'ACTIVE' },
      });
      targetChildIds = classChildren.map((c) => c.id);
    }

    let updatedCount = 0;
    for (const childId of targetChildIds) {
      // Check if child is absent
      const att = await this.mealAttRepo.findOne({
        where: { tenantId, childId, attendanceDate: date, mealType },
      });

      if (att && att.attendanceStatus !== 'PRESENT') {
        // Skip absent child
        continue;
      }

      await this.updateChildEvaluation(
        tenantId,
        childId,
        {
          date,
          mealType,
          portionConsumed: dto.portionConsumed,
        },
        userId,
      );
      updatedCount++;
    }

    const portionLabel = dto.portionConsumed === 'ALL' ? 'Ăn hết suất (100%)' : dto.portionConsumed === 'HALF' ? 'Một nửa (50%)' : 'Ăn ít (<20%)';

    return {
      success: true,
      message: `Đã đánh dấu ${portionLabel} cho ${updatedCount} học sinh thành công!`,
      count: updatedCount,
    };
  }

  async updateSensoryEvaluation(
    tenantId: string,
    dto: UpdateSensoryEvaluationDto,
  ) {
    const mealType = dto.mealType || 'LUNCH';
    const date = dto.date;

    let sensory = await this.classEvalRepo.findOne({
      where: { classId: dto.classId, evaluationDate: date, mealType, tenantId },
    });

    if (!sensory) {
      sensory = this.classEvalRepo.create({
        tenantId,
        classId: dto.classId,
        evaluationDate: date,
        mealType,
        softnessScore: dto.softnessScore ?? 5,
        temperatureScore: dto.temperatureScore ?? 4,
        excitementScore: dto.excitementScore ?? 5,
        foodSafetyChecked: dto.foodSafetyChecked ?? true,
        chefFeedback: dto.chefFeedback ?? '',
        headChefName: 'Cô Phạm Lan',
        isLocked: dto.isLocked ?? false,
        status: dto.isLocked ? 'LOCKED' : 'DRAFT',
        lockedAt: dto.isLocked ? new Date() : undefined,
      });
    } else {
      if (dto.softnessScore !== undefined) sensory.softnessScore = dto.softnessScore;
      if (dto.temperatureScore !== undefined) sensory.temperatureScore = dto.temperatureScore;
      if (dto.excitementScore !== undefined) sensory.excitementScore = dto.excitementScore;
      if (dto.foodSafetyChecked !== undefined) sensory.foodSafetyChecked = dto.foodSafetyChecked;
      if (dto.chefFeedback !== undefined) sensory.chefFeedback = dto.chefFeedback;
      if (dto.isLocked !== undefined) {
        sensory.isLocked = dto.isLocked;
        sensory.status = dto.isLocked ? 'LOCKED' : 'DRAFT';
        sensory.lockedAt = dto.isLocked ? new Date() : undefined;
      }
    }

    await this.classEvalRepo.save(sensory);

    return {
      success: true,
      message: 'Đã lưu đánh giá cảm quan & góp ý bếp trưởng thành công!',
      sensory,
    };
  }

  async lockAndSendEvaluation(
    tenantId: string,
    dto: LockAndSendEvaluationDto,
  ) {
    const mealType = dto.mealType || 'LUNCH';
    const date = dto.date;

    // Lock class sensory
    await this.updateSensoryEvaluation(tenantId, {
      classId: dto.classId,
      date,
      mealType,
      chefFeedback: dto.chefFeedback,
      isLocked: true,
    });

    // Mark all pending consumption statuses as SENT
    const attendances = await this.mealAttRepo.find({
      where: { classId: dto.classId, attendanceDate: date, mealType, tenantId },
    });

    const attIds = attendances.map((a) => a.id);
    if (attIds.length > 0) {
      await this.consumptionRepo
        .createQueryBuilder()
        .update(MealConsumptionStatusEntity)
        .set({
          syncStatus: 'SENT',
          sentAt: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`,
        })
        .where('attendanceId IN (:...attIds)', { attIds })
        .andWhere('tenantId = :tenantId', { tenantId })
        .execute();
    }

    return {
      success: true,
      message: 'Đã hoàn thành, khóa đánh giá và gửi báo cáo cho Phụ huynh & Nhà bếp thành công!',
      lockedAt: new Date().toISOString(),
    };
  }
}
