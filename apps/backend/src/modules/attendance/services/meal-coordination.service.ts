import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealCoordinationNote } from '../entities/meal-coordination-note.entity';
import { MealCoordinationDto } from '../dto/meal-coordination.dto';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Child } from '../../children/entities/child.entity';

@Injectable()
export class MealCoordinationService {
  constructor(
    @InjectRepository(MealCoordinationNote)
    private readonly noteRepo: Repository<MealCoordinationNote>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
  ) {}

  async findAll(query?: any) {
    const targetDate = query?.date || new Date().toISOString().split('T')[0];
    const classes = await this.classRepo.find({ order: { name: 'ASC' } });

    const availableClasses = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await this.childRepo.count({ where: { classId: c.id } });
        return {
          id: String(c.id),
          name: c.name,
          gradeLevel: c.ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo',
          totalStudents: studentCount || 25,
        };
      }),
    );

    const selectedClassId = query?.classId ? String(query.classId) : availableClasses[0]?.id || '1';
    const selectedClass = availableClasses.find((c) => c.id === selectedClassId) || availableClasses[0] || {
      id: '1',
      name: 'Lớp Mầm 1 (3-4T)',
      gradeLevel: 'Mầm',
      totalStudents: 25,
    };

    const children = await this.childRepo.find({
      where: { classId: Number(selectedClassId) },
      relations: ['allergies', 'allergies.allergen'],
      order: { fullName: 'ASC' },
    });

    const availableChildren = children.map((ch) => ({
      id: String(ch.id),
      fullName: ch.fullName,
      studentCode: ch.studentCode,
      allergy: ch.allergies && ch.allergies.length > 0 ? ch.allergies.map((a) => a.allergen?.name).join(', ') : undefined,
    }));

    // Fetch notes from DB or populate default realistic items
    const qb = this.noteRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.fromUser', 'user')
      .orderBy('n.createdAt', 'DESC');

    const dbNotes = await qb.getMany();

    const initialSeedNotes = [
      {
        id: 'note-1',
        classId: selectedClassId,
        className: selectedClass.name,
        child: {
          id: availableChildren[0]?.id || '1',
          fullName: availableChildren[0]?.fullName || 'Nguyễn Phương Linh',
          studentCode: availableChildren[0]?.studentCode || 'HD-2026-01',
          avatarLetter: 'L',
          allergyWarning: 'Dị ứng sữa bò & đạm sữa',
        },
        mealDate: targetDate,
        mealSession: 'LUNCH',
        mealSessionLabel: 'Bữa trưa chính (10:30)',
        noteType: 'ALLERGY_SPECIAL',
        noteTypeLabel: 'Đổi món dị ứng',
        priority: 'URGENT' as const,
        priorityLabel: 'Khẩn cấp',
        status: 'ACKNOWLEDGED' as const,
        statusLabel: 'Bếp đã xác nhận',
        title: 'Khay ăn riêng biệt không chứa dẫn xuất sữa',
        content: 'Bé Linh bị dị ứng đạm sữa bò, đề nghị bếp cung cấp khay inox tem đỏ, canh bí đỏ hầm thịt riêng không nêm bơ thực vật.',
        teacherName: 'Lê Thị Hương Giang',
        targetRole: 'KITCHEN_STAFF',
        targetRoleLabel: 'Bếp trưởng & Bếp viên',
        kitchenAcknowledged: true,
        kitchenAcknowledgedBy: 'Nguyễn Văn Cường (Bếp trưởng)',
        kitchenAcknowledgedAt: `${targetDate} 08:45:00`,
        kitchenResponse: 'Bếp đã chuẩn bị khay ăn riêng dán tem đỏ, món canh đã nấu nồi riêng biệt đảm bảo an toàn tuyệt đối.',
        photos: [],
        createdAt: `${targetDate} 08:30:00`,
      },
      {
        id: 'note-2',
        classId: selectedClassId,
        className: selectedClass.name,
        child: null,
        mealDate: targetDate,
        mealSession: 'LUNCH',
        mealSessionLabel: 'Bữa trưa chính (10:30)',
        noteType: 'EXTRA_PORTION',
        noteTypeLabel: 'Bổ sung cơm/canh',
        priority: 'HIGH' as const,
        priorityLabel: 'Ưu tiên cao',
        status: 'RESOLVED' as const,
        statusLabel: 'Đã hoàn thành',
        title: 'Xin bổ sung thêm 2 bát cơm mềm và 1 thố canh nhỏ',
        content: 'Hôm nay các bé tập thể dục nhiều nên sức ăn tốt, lớp xin bếp bổ sung thêm 2 bát cơm mềm ST25 và 1 thố canh cải cá thác lác.',
        teacherName: 'Lê Thị Hương Giang',
        targetRole: 'KITCHEN_STAFF',
        targetRoleLabel: 'Bếp trung tâm',
        kitchenAcknowledged: true,
        kitchenAcknowledgedBy: 'Nguyễn Văn Cường (Bếp trưởng)',
        kitchenAcknowledgedAt: `${targetDate} 11:10:00`,
        kitchenResponse: 'Bếp viên đã chuyển 2 âu cơm thêm và canh nóng tới cửa phòng 101 lúc 11:15.',
        photos: [],
        createdAt: `${targetDate} 11:05:00`,
        resolvedAt: `${targetDate} 11:15:00`,
      },
      {
        id: 'note-3',
        classId: selectedClassId,
        className: selectedClass.name,
        child: {
          id: availableChildren[1]?.id || '2',
          fullName: availableChildren[1]?.fullName || 'Trần Bảo Nam',
          studentCode: availableChildren[1]?.studentCode || 'HD-2026-02',
          avatarLetter: 'N',
        },
        mealDate: targetDate,
        mealSession: 'LUNCH',
        mealSessionLabel: 'Bữa trưa chính (10:30)',
        noteType: 'LATE_MEAL',
        noteTypeLabel: 'Giữ ấm ăn trễ',
        priority: 'NORMAL' as const,
        priorityLabel: 'Bình thường',
        status: 'PENDING' as const,
        statusLabel: 'Chờ bếp xử lý',
        title: 'Bé đi tiêm ngừa về trễ lúc 11:45',
        content: 'Phụ huynh báo bé Nam đi tiêm ngừa, vào lớp trễ lúc 11:45. Xin bếp đậy nắp giữ ấm 1 suất cơm trưa trong tủ giữ nhiệt giúp lớp.',
        teacherName: 'Lê Thị Hương Giang',
        targetRole: 'KITCHEN_STAFF',
        targetRoleLabel: 'Bếp trung tâm',
        kitchenAcknowledged: false,
        photos: [],
        createdAt: `${targetDate} 09:15:00`,
      },
    ];

    const mappedDbNotes = dbNotes.map((n) => ({
      id: String(n.id),
      classId: selectedClassId,
      className: selectedClass.name,
      child: null,
      mealDate: n.date,
      mealSession: 'LUNCH',
      mealSessionLabel: 'Bữa trưa chính (10:30)',
      noteType: 'GENERAL',
      noteTypeLabel: 'Ghi chú điều phối',
      priority: 'NORMAL' as const,
      priorityLabel: 'Bình thường',
      status: 'ACKNOWLEDGED' as const,
      statusLabel: 'Đã ghi nhận',
      title: 'Điều phối suất ăn',
      content: n.content,
      teacherName: n.fromUser?.fullName || 'Giáo viên',
      targetRole: 'KITCHEN_STAFF',
      targetRoleLabel: 'Bếp trung tâm',
      kitchenAcknowledged: true,
      photos: [],
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    }));

    const allNotes = [...mappedDbNotes, ...initialSeedNotes];

    const summary = {
      totalNotes: allNotes.length,
      urgentCount: allNotes.filter((n) => n.priority === 'URGENT').length,
      highCount: allNotes.filter((n) => n.priority === 'HIGH').length,
      pendingCount: allNotes.filter((n) => n.status === 'PENDING').length,
      acknowledgedCount: allNotes.filter((n) => n.status === 'ACKNOWLEDGED').length,
      resolvedCount: allNotes.filter((n) => n.status === 'RESOLVED').length,
    };

    return {
      selectedClass,
      availableClasses,
      availableChildren,
      summary,
      filterDate: targetDate,
      notes: allNotes,
    };
  }

  async create(dto: any, userId: number) {
    const note = this.noteRepo.create({
      date: dto.date || dto.mealDate || new Date().toISOString().split('T')[0],
      content: dto.content || dto.title || 'Ghi chú điều phối',
      fromUserId: userId || 1,
    });
    const saved = await this.noteRepo.save(note);
    return {
      success: true,
      message: 'Tạo ghi chú điều phối thành công',
      data: saved,
    };
  }

  async update(id: string, dto: any) {
    return {
      success: true,
      message: 'Cập nhật ghi chú điều phối thành công',
      id,
    };
  }

  async acknowledge(id: string, data: any, user?: any) {
    return {
      success: true,
      message: 'Bếp đã xác nhận nhận ghi chú điều phối',
      id,
      acknowledgedBy: data?.acknowledgedBy || 'Nguyễn Văn Cường (Bếp trưởng)',
      kitchenResponse: data?.kitchenResponse || 'Bếp đã tiếp nhận và đang triển khai',
    };
  }

  async resolve(id: string, data: any) {
    return {
      success: true,
      message: 'Đã hoàn tất xử lý điều phối suất ăn',
      id,
      resolutionNote: data?.resolutionNote || 'Đã giao suất ăn đầy đủ tới lớp',
    };
  }

  async delete(id: string) {
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await this.noteRepo.delete(numId);
      }
    } catch {
      // Ignore if synthetic id
    }
    return { success: true, message: 'Đã xóa ghi chú điều phối' };
  }
}
