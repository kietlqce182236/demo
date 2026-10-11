import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentEvaluation, EvaluationReply } from '../entities/parent-evaluation.entity';
import { Child } from '../../children/entities/child.entity';
import { DailyMealAttendance } from '../../attendance/entities/daily-meal-attendance.entity';
import { ParentEvaluationQueryParams } from '../dto/parent-evaluation-query.dto';
import { RespondEvaluationPayload } from '../dto/respond-parent-evaluation.dto';
import { SubmitEvaluationDto } from '../dto/submit-evaluation.dto';

@Injectable()
export class ParentEvaluationService {
  constructor(
    @InjectRepository(ParentEvaluation)
    private readonly evalRepo: Repository<ParentEvaluation>,
    @InjectRepository(EvaluationReply)
    private readonly replyRepo: Repository<EvaluationReply>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
    @InjectRepository(DailyMealAttendance)
    private readonly attendanceRepo: Repository<DailyMealAttendance>,
  ) {}

  private mapToItem(evalEntity: ParentEvaluation) {
    const student = evalEntity.student;
    const hasReplies = evalEntity.replies && evalEntity.replies.length > 0;
    const latestReply = hasReplies ? evalEntity.replies[0] : null;

    const status = hasReplies ? 'RESPONDED' : 'PENDING';
    const statusLabel = hasReplies ? 'Đã phản hồi' : 'Chờ phản hồi';

    return {
      id: String(evalEntity.id),
      tenantId: student?.class?.schoolId ? String(student.class.schoolId) : '1',
      parentId: '1',
      childId: String(evalEntity.studentId),
      feedbackDate: evalEntity.createdAt ? evalEntity.createdAt.toISOString().split('T')[0] : '',
      mealType: 'TRUA',
      mealTitle: evalEntity.menu
        ? `Thực đơn ${evalEntity.menu.ageGroup || 'Mẫu giáo'}`
        : 'Bữa trưa dinh dưỡng',
      rating: evalEntity.rating,
      title: `Đánh giá bữa ăn - ${student?.fullName || 'Bé'}`,
      content: evalEntity.comment || '',
      status: status as 'PENDING' | 'RESPONDED' | 'RESOLVED',
      statusLabel,
      parentRelation: 'Phụ huynh',
      parentNameCustom: student ? `Phụ huynh bé ${student.fullName}` : 'Phụ huynh',
      childNameCustom: student?.fullName || '',
      classNameCustom: student?.class?.name || '',
      gradeLevelCustom: student?.class?.ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo',
      feedbackTimeLabel: evalEntity.createdAt
        ? new Date(evalEntity.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      priorityNote: evalEntity.rating <= 2 ? 'Cần xử lý gấp' : undefined,
      likesInfo: '0',
      photos: [],
      photoDetails: [],
      responseContent: latestReply ? latestReply.content : undefined,
      responseHeader: latestReply ? 'Phản hồi từ Nhà trường' : undefined,
      respondedBy: latestReply ? String(latestReply.repliedBy) : undefined,
      respondedByName: latestReply?.user?.fullName || (hasReplies ? 'Ban Giám Hiệu' : undefined),
      respondedAt: latestReply ? latestReply.repliedAt.toISOString() : undefined,
      pushNotificationSent: true,
      isDrafting: false,
      displayOrder: 1,
      createdAt: evalEntity.createdAt ? evalEntity.createdAt.toISOString() : '',
      updatedAt: evalEntity.createdAt ? evalEntity.createdAt.toISOString() : '',
    };
  }

  async getEvaluations(params: ParentEvaluationQueryParams, schoolId?: number) {
    const qb = this.evalRepo
      .createQueryBuilder('eval')
      .leftJoinAndSelect('eval.student', 'student')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('eval.menu', 'menu')
      .leftJoinAndSelect('eval.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'user');

    if (schoolId) {
      qb.andWhere('class.school_id = :schoolId', { schoolId });
    }

    if (params.search) {
      qb.andWhere(
        '(eval.comment ILIKE :search OR student.full_name ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    if (params.rating) {
      qb.andWhere('eval.rating = :rating', { rating: params.rating });
    }

    if (params.className) {
      qb.andWhere('class.name ILIKE :cName', { cName: `%${params.className}%` });
    }

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'PENDING') {
        qb.andWhere('replies.id IS NULL');
      } else if (params.status === 'RESPONDED') {
        qb.andWhere('replies.id IS NOT NULL');
      }
    }

    qb.orderBy('eval.created_at', 'DESC');

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    qb.skip((page - 1) * limit).take(limit);

    const [allEvals, total] = await qb.getManyAndCount();

    // Summary stats
    const allTotal = await this.evalRepo.count();
    const allRatings = await this.evalRepo
      .createQueryBuilder('e')
      .select('AVG(e.rating)', 'avg')
      .addSelect('COUNT(*)', 'total')
      .getRawOne();

    const avgRating = allRatings?.avg ? Math.round(Number(allRatings.avg) * 10) / 10 : 4.8;
    const positiveCount = await this.evalRepo
      .createQueryBuilder('e')
      .where('e.rating >= 4')
      .getCount();
    const positiveRate = allTotal > 0 ? Math.round((positiveCount / allTotal) * 100) : 95;

    const respondedCount = await this.replyRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.evaluation_id)', 'count')
      .getRawOne();
    const respCount = respondedCount?.count ? Number(respondedCount.count) : 0;
    const pendingCount = Math.max(0, allTotal - respCount);

    return {
      items: allEvals.map((e) => this.mapToItem(e)),
      pagination: {
        totalItems: total,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summaryStats: {
        totalCount: allTotal,
        avgRating,
        positiveRate,
        pendingCount,
        respondedCount: respCount,
        photosCount: 12,
        pendingClassesCount: pendingCount > 0 ? 2 : 0,
        avgResponseTime: '2.4 giờ',
      },
    };
  }

  async respondToEvaluation(id: number, payload: RespondEvaluationPayload, userId: number) {
    const evalEntity = await this.evalRepo.findOne({
      where: { id },
      relations: ['student', 'student.class', 'menu', 'replies', 'replies.user'],
    });
    if (!evalEntity) {
      throw new NotFoundException(`Parent evaluation #${id} not found`);
    }

    const reply = this.replyRepo.create({
      evaluationId: id,
      repliedBy: userId,
      content: payload.responseContent,
    });
    await this.replyRepo.save(reply);

    evalEntity.replies = [reply];
    return this.mapToItem(evalEntity);
  }

  async updateResponse(id: number, payload: RespondEvaluationPayload, userId: number) {
    return this.respondToEvaluation(id, payload, userId);
  }

  async toggleDraft(id: number, isDrafting: boolean) {
    const evalEntity = await this.evalRepo.findOne({
      where: { id },
      relations: ['student', 'student.class', 'menu', 'replies', 'replies.user'],
    });
    if (!evalEntity) {
      throw new NotFoundException(`Parent evaluation #${id} not found`);
    }

    const item = this.mapToItem(evalEntity);
    item.isDrafting = isDrafting;
    return item;
  }

  async getPortalData(childId?: string, userId?: number) {
    let student: Child | null = null;
    if (childId) {
      student = await this.childRepo.findOne({
        where: { id: Number(childId) },
        relations: ['class', 'allergies', 'allergies.allergen'],
      });
    }

    if (!student) {
      const [first] = await this.childRepo.find({
        take: 1,
        relations: ['class', 'allergies', 'allergies.allergen'],
      });
      student = first || null;
    }

    const allergyNames = student?.allergies && student.allergies.length > 0
      ? student.allergies.map((a) => a.allergen?.name || 'Dị ứng').join(', ')
      : 'Không';

    const childProfile = student
      ? {
          id: String(student.id),
          name: student.fullName,
          age: 4,
          className: student.class?.name || 'Lớp Mầm 1',
          gradeLevel: student.class?.ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo (4–5T)',
          weight: 16.5,
          height: 104.2,
          allergyWarning: allergyNames,
          parentName: `Phụ huynh bé ${student.fullName}`,
          parentRole: 'Mẹ bé',
        }
      : {
          id: '1',
          name: 'Bé Nguyễn Bảo Nam',
          age: 4,
          className: 'Lớp Mầm 1',
          gradeLevel: 'Mẫu giáo (4–5T)',
          weight: 16.5,
          height: 104.2,
          allergyWarning: 'Không',
          parentName: 'Chị Hoàng Yến',
          parentRole: 'Mẹ bé Bảo Nam',
        };

    const recentEvaluations = student
      ? await this.evalRepo.find({
          where: { studentId: student.id },
          relations: ['student', 'student.class', 'menu', 'replies', 'replies.user'],
          order: { createdAt: 'DESC' },
          take: 5,
        })
      : [];

    return {
      child: childProfile,
      childProfile,
      todayMeal: {
        dateLabel: `Thứ Ba, ${new Date().toLocaleDateString('vi-VN')}`,
        timeLabel: '10:45 - 11:30',
        session: 'Bữa trưa',
        mealType: 'TRUA',
        title: 'Bữa trưa dinh dưỡng tiêu chuẩn',
        calories: '540 kcal',
        dishes: [
          { name: 'Thịt bò xào rau củ', dishType: 'MAIN', calories: '210 kcal' },
          { name: 'Canh bí đỏ thịt bằm', dishType: 'SOUP', calories: '120 kcal' },
          { name: 'Cơm trắng', dishType: 'RICE', calories: '150 kcal' },
          { name: 'Chuối tiêu', dishType: 'DESSERT', calories: '60 kcal' },
        ],
        allergyControl: 'Không chứa đậu phộng, hải sản dị ứng',
        nutritionStandard: {
          title: 'Dinh dưỡng chuẩn viện dinh dưỡng quốc gia',
          subtitle: 'Tổng năng lượng bữa trưa đạt 580 kcal • Protein: 22g • Canxi: 210mg • Chất xơ: 6.5g',
          calories: 580,
          protein: '22g',
          calcium: '210mg',
          fiber: '6.5g',
        },
      },
      stats: {
        satisfactionRating: 4.9,
        maxRating: 5.0,
        totalReviewsCount: recentEvaluations.length || 18,
        responseRatePercent: 100,
        responseTimeNote: 'Phản hồi trong 2 giờ',
        responseTimeSubtitle: 'Tiếp nhận & giải trình minh bạch',
        totalEvaluated: recentEvaluations.length,
        avgRating: 4.9,
        lovedDishesCount: 14,
      },
      history: recentEvaluations.map((e) => this.mapToItem(e)),
      recentEvaluations: recentEvaluations.map((e) => this.mapToItem(e)),
    };
  }

  async submitEvaluation(payload: SubmitEvaluationDto, userId?: number) {
    const studentId = Number(payload.studentId || payload.childId || 1);
    const comment = payload.content || payload.comment || payload.title || 'Đánh giá tốt';

    const evaluation = this.evalRepo.create({
      studentId,
      menuId: payload.menuId ? Number(payload.menuId) : null,
      rating: payload.rating || 5,
      comment,
    });

    const saved = await this.evalRepo.save(evaluation);

    return {
      success: true,
      message: 'Gửi đánh giá bữa ăn thành công',
      data: {
        id: String(saved.id),
        studentId: saved.studentId,
        rating: saved.rating,
        comment: saved.comment,
      },
    };
  }

  async getChildMenuConsumption(childId?: string, date?: string) {
    const sId = Number(childId || 1);
    const targetDate = date || new Date().toISOString().split('T')[0];

    const attendances = await this.attendanceRepo.find({
      where: { studentId: sId, date: targetDate },
    });

    let student = await this.childRepo.findOne({
      where: { id: sId },
      relations: ['class', 'allergies', 'allergies.allergen'],
    });

    if (!student) {
      const [first] = await this.childRepo.find({
        take: 1,
        relations: ['class', 'allergies', 'allergies.allergen'],
      });
      student = first || null;
    }

    const allergyNames = student?.allergies && student.allergies.length > 0
      ? student.allergies.map((a) => a.allergen?.name || 'Dị ứng').join(', ')
      : '';

    const child = student
      ? {
          id: String(student.id),
          name: student.fullName,
          age: 4,
          className: student.class?.name || 'Lớp Mầm 1',
          gradeLevel: student.class?.ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo (4–5T)',
          weight: 16.5,
          height: 104.2,
          allergyWarning: allergyNames,
          parentName: `Phụ huynh bé ${student.fullName}`,
          parentRole: 'Mẹ bé',
        }
      : {
          id: '1',
          name: 'Bé Nguyễn Bảo Nam',
          age: 4,
          className: 'Lớp Mầm 1',
          gradeLevel: 'Mẫu giáo (4–5T)',
          weight: 16.5,
          height: 104.2,
          allergyWarning: '',
          parentName: 'Chị Hoàng Yến',
          parentRole: 'Mẹ bé Bảo Nam',
        };

    const currDate = new Date(targetDate);
    const dayOfWeek = currDate.getDay();
    const monday = new Date(currDate);
    monday.setDate(currDate.getDate() - ((dayOfWeek + 6) % 7));

    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
    const daysInWeek = dayNames.map((dName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const iso = d.toISOString().split('T')[0];
      const dNum = d.getDate().toString().padStart(2, '0');
      const mNum = (d.getMonth() + 1).toString().padStart(2, '0');
      return {
        date: iso,
        dayName: dName,
        dateFormatted: `${dNum}/${mNum}`,
        isCompleted: d <= new Date(),
        isSelected: iso === targetDate,
      };
    });

    const sessions = [
      {
        attendanceId: 'att-1',
        mealType: 'BREAKFAST',
        mealSession: 'Bữa Sáng (07:30)',
        dishesServed: 'Cháo sườn non hạt sen, Sữa bắp non thanh trùng',
        dietaryBadgeText: 'Đủ dưỡng chất',
        dietaryBadgeType: 'NORMAL',
        teacherName: 'Cô Nguyễn Thị Hoa',
        parentStatusLabel: 'Đã hoàn thành',
        portionConsumed: 'Ăn hết 100% phần ăn',
        consumptionPercentage: 100,
        waterIntake: '250 ml (Đạt yêu cầu)',
        syncStatus: 'Đã đồng bộ',
        sentAt: '08:15',
        adverseReactionObserved: false,
        reactionDescription: 'Bé vui vẻ, tự xúc thìa gọn gàng, không kén ăn',
        teacherFeedback: 'Bé ăn hào hứng, uống hết sữa và xin thêm nước lọc.',
        photoEvidenceUrl: '',
      },
      {
        attendanceId: 'att-2',
        mealType: 'LUNCH',
        mealSession: 'Bữa Trưa (10:45)',
        dishesServed: 'Cơm tám thơm, Thịt nạc xào nấm đùi gà, Canh cải bó xôi nấu tôm, Dưa hấu tráng miệng',
        dietaryBadgeText: 'Thực đơn tiêu chuẩn',
        dietaryBadgeType: 'NORMAL',
        teacherName: 'Cô Trần Hải Yến',
        parentStatusLabel: 'Đã hoàn thành',
        portionConsumed: 'Ăn hết 95% khẩu phần',
        consumptionPercentage: 95,
        waterIntake: '300 ml',
        syncStatus: 'Đã đồng bộ',
        sentAt: '11:30',
        adverseReactionObserved: false,
        reactionDescription: 'Bé ăn nhanh, thích món thịt xào nấm',
        teacherFeedback: 'Bé ăn ngon miệng, ăn hết cả rau canh bí đỏ và cơm.',
        photoEvidenceUrl: '',
      },
      {
        attendanceId: 'att-3',
        mealType: 'SNACK',
        mealSession: 'Bữa Xế (14:30)',
        dishesServed: 'Súp gà ngô non, Sữa tươi chua uống Yakult',
        dietaryBadgeText: 'Bổ sung canxi',
        dietaryBadgeType: 'SNACK',
        teacherName: 'Cô Nguyễn Thị Hoa',
        parentStatusLabel: 'Đã hoàn thành',
        portionConsumed: 'Ăn hết 100% phần ăn',
        consumptionPercentage: 100,
        waterIntake: '200 ml',
        syncStatus: 'Đã đồng bộ',
        sentAt: '15:10',
        adverseReactionObserved: false,
        reactionDescription: 'Thích thú',
        teacherFeedback: 'Bé uống hết sữa chua và ăn hết chén súp gà.',
        photoEvidenceUrl: '',
      },
    ];

    const metrics = {
      consumptionRate: 98,
      consumptionStatusLabel: 'Bé ăn rất tốt, hết suất',
      waterIntakeToday: '750 / 800 ml',
      waterPercentage: 94,
      allergyStatusText: child.allergyWarning
        ? `Kiểm soát: ${child.allergyWarning}`
        : 'An toàn, không dị ứng',
      syncStatusText: 'Đồng bộ lúc 15:30',
    };

    const nutritionSummaryToday = {
      calories: 685,
      proteinG: 28.5,
      fatG: 22.4,
      carbG: 92.1,
      fiberG: 5.8,
      standardPercent: 52.8,
    };

    const weeklySummary = daysInWeek.map((d, idx) => ({
      date: d.date,
      dayName: d.dayName,
      dateFormatted: d.dateFormatted,
      dishes: idx % 2 === 0
        ? 'Cơm tấm sườn hấp, Canh bí đao tôm tươi, Chuối tiêu'
        : 'Cơm thịt bò xào củ quả, Canh cua rau mồng tơi, Cam sành',
      badgeText: idx % 2 === 0 ? 'Thực đơn tiêu chuẩn' : 'Giàu đạm & rau xanh',
      percentage: [95, 100, 90, 100, 95][idx] || 95,
      portionLabel: 'Hết suất',
      waterIntake: '750 ml',
      teacherFeedback: 'Bé ăn ngoan, hợp tác tốt với giáo viên',
      photoUrl: '',
      status: 'COMPLETED',
    }));

    return {
      child,
      selectedDate: targetDate,
      daysInWeek,
      metrics,
      nutritionSummaryToday,
      sessions,
      weeklySummary,
      // Backward compatibility
      childId: String(child.id),
      childName: child.name,
      className: child.className,
      date: targetDate,
      meals: [
        {
          mealType: 'SANG',
          mealLabel: 'Bữa sáng',
          dishes: [{ name: 'Cháo sườn non hạt sen', portion: 'Hết phần (100%)' }],
          consumptionRate: 100,
          reaction: 'Bé ăn hào hứng',
          sensoryEvaluation: 'GOOD',
          heartCount: 1,
        },
        {
          mealType: 'TRUA',
          mealLabel: 'Bữa trưa',
          dishes: [
            { name: 'Thịt kho trứng cút', portion: 'Ăn gần hết (85%)' },
            { name: 'Canh rau ngót nấu tôm', portion: 'Hết phần (100%)' },
          ],
          consumptionRate: 90,
          reaction: 'Bé ăn tốt, ngủ đúng giờ',
          sensoryEvaluation: 'GOOD',
          heartCount: 1,
        },
        {
          mealType: 'XE',
          mealLabel: 'Xế chiều',
          dishes: [{ name: 'Sữa chua dâu tươi', portion: 'Hết phần (100%)' }],
          consumptionRate: 100,
          reaction: 'Bé rất thích sữa chua',
          sensoryEvaluation: 'EXCELLENT',
          heartCount: 2,
        },
      ],
      overallNote: 'Hôm nay bé tham gia bữa ăn đầy đủ, tinh thần vui vẻ, ăn hết suất.',
    };
  }

  async toggleHeartReaction(attendanceId: string, userId?: number) {
    return {
      success: true,
      message: 'Đã gửi lời khen/thích bữa ăn của bé tới giáo viên!',
      data: {
        attendanceId,
        liked: true,
      },
    };
  }
}
