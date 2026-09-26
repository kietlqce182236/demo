import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MealCoordinationNoteEntity } from '../entities/meal-coordination-note.entity';
import { ClassEntity } from '../entities/class.entity';
import { ChildEntity } from '../entities/child.entity';
import { DailyMealAttendanceEntity } from '../entities/daily-meal-attendance.entity';
import {
  MealCoordinationQueryDto,
  CreateMealCoordinationNoteDto,
  UpdateMealCoordinationNoteDto,
  AcknowledgeCoordinationDto,
  ResolveCoordinationDto,
} from '../dto/meal-coordination.dto';

export interface FormattedCoordinationNote {
  id: string;
  classId: string;
  className: string;
  child: {
    id: string;
    fullName: string;
    studentCode: string;
    avatarLetter: string;
    allergyWarning?: string;
  } | null;
  mealDate: string;
  mealSession: string;
  mealSessionLabel: string;
  noteType: string;
  noteTypeLabel: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  title: string;
  content: string;
  teacherName: string;
  targetRole: string;
  targetRoleLabel: string;
  kitchenAcknowledged: boolean;
  kitchenAcknowledgedBy?: string;
  kitchenAcknowledgedAt?: string;
  kitchenResponse?: string;
  photos: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface MealCoordinationResponse {
  selectedClass: {
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  };
  availableClasses: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  }>;
  availableChildren: Array<{
    id: string;
    fullName: string;
    studentCode: string;
    allergy?: string;
  }>;
  summary: {
    totalNotes: number;
    urgentCount: number;
    highCount: number;
    pendingCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
  };
  filterDate: string;
  notes: FormattedCoordinationNote[];
}

@Injectable()
export class MealCoordinationService {
  constructor(
    @InjectRepository(MealCoordinationNoteEntity)
    private readonly noteRepo: Repository<MealCoordinationNoteEntity>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ChildEntity)
    private readonly childRepo: Repository<ChildEntity>,
    @InjectRepository(DailyMealAttendanceEntity)
    private readonly mealAttRepo: Repository<DailyMealAttendanceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private getSessionLabel(session: string): string {
    switch (session) {
      case 'BREAKFAST':
        return 'Bữa sáng (07:30 - 08:15)';
      case 'LUNCH':
        return 'Bữa trưa chính (10:30 - 11:45)';
      case 'AFTERNOON_SNACK':
        return 'Bữa xế chiều (14:30 - 15:15)';
      case 'ALL_DAY':
        return 'Cả ngày (Tất cả bữa ăn)';
      default:
        return session;
    }
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'PORTION_ADJUSTMENT':
        return 'Điều chỉnh khẩu phần / Cắt suất';
      case 'ALLERGY_WARNING':
        return 'Cảnh báo dị ứng khẩn cấp';
      case 'MEDICATION_FEEDING':
        return 'Dặn dò uống thuốc & chăm sóc';
      case 'SPECIAL_DIET':
        return 'Chế độ ăn riêng (Cháo mềm/Kiêng)';
      case 'KITCHEN_REQUEST':
        return 'Yêu cầu phối hợp nhà bếp';
      case 'PARENT_DIRECTIVE':
        return 'Dặn dò từ phụ huynh';
      case 'GENERAL_OBSERVATION':
        return 'Quan sát & Ghi chú chung';
      default:
        return type;
    }
  }

  private getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'HIGH':
        return 'Quan trọng';
      case 'NORMAL':
        return 'Tiêu chuẩn';
      default:
        return priority;
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Chờ tiếp nhận';
      case 'ACKNOWLEDGED':
        return 'Bếp đã tiếp nhận';
      case 'PROCESSING':
        return 'Đang chuẩn bị';
      case 'RESOLVED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  private getTargetRoleLabel(role: string): string {
    switch (role) {
      case 'KITCHEN':
        return 'Bếp Bán Trú';
      case 'HEALTH_OFFICER':
        return 'Y Tế Trường';
      case 'PRINCIPAL':
        return 'Ban Giám Hiệu';
      case 'PARENT':
        return 'Phụ Huynh';
      default:
        return role;
    }
  }

  async getCoordinationData(
    tenantId: string,
    query: MealCoordinationQueryDto,
  ): Promise<MealCoordinationResponse> {
    // 1. Get all active classes
    const classes = await this.classRepo.find({
      where: { tenantId, status: 'ACTIVE' },
      order: { name: 'ASC' },
      relations: ['children'],
    });

    if (!classes || classes.length === 0) {
      throw new NotFoundException('Không tìm thấy lớp học trong cơ sở dữ liệu');
    }

    // 2. Determine targeted class
    let targetClass = classes.find((c) => c.id === query.classId);
    if (!targetClass) {
      // Prefer Chồi 1 or first class with children
      targetClass =
        classes.find((c) => c.name.includes('Chồi 1')) ||
        classes.find((c) => c.children && c.children.length > 0) ||
        classes[0];
    }

    // 3. Determine target date (default to today or '2024-10-25' if query specifies)
    const targetDate = query.date || new Date().toISOString().split('T')[0];

    // 4. Query notes from DB
    const qb = this.noteRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.class', 'cls')
      .leftJoinAndSelect('n.child', 'ch')
      .leftJoinAndSelect('ch.allergies', 'alg')
      .where('n.tenantId = :tenantId', { tenantId });

    if (query.classId) {
      qb.andWhere('n.classId = :classId', { classId: query.classId });
    } else if (targetClass) {
      // Show notes for targetClass or whole-school notes
      qb.andWhere('(n.classId = :classId OR n.classId IS NULL)', { classId: targetClass.id });
    }

    if (query.date) {
      qb.andWhere('n.mealDate = :date', { date: query.date });
    }

    if (query.mealSession && query.mealSession !== 'ALL') {
      qb.andWhere('n.mealSession = :session', { session: query.mealSession });
    }

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('n.status = :status', { status: query.status });
    }

    if (query.priority && query.priority !== 'ALL') {
      qb.andWhere('n.priority = :priority', { priority: query.priority });
    }

    if (query.noteType && query.noteType !== 'ALL') {
      qb.andWhere('n.noteType = :noteType', { noteType: query.noteType });
    }

    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(n.title) LIKE :s OR LOWER(n.content) LIKE :s OR LOWER(ch.fullName) LIKE :s OR LOWER(ch.studentCode) LIKE :s OR LOWER(n.teacherName) LIKE :s)',
        { s },
      );
    }

    qb.orderBy('n.createdAt', 'DESC');
    const notes = await qb.getMany();

    // 5. Calculate summary metrics
    let urgentCount = 0;
    let highCount = 0;
    let pendingCount = 0;
    let acknowledgedCount = 0;
    let resolvedCount = 0;

    notes.forEach((n) => {
      if (n.priority === 'URGENT') urgentCount++;
      if (n.priority === 'HIGH') highCount++;
      if (n.status === 'PENDING') pendingCount++;
      if (n.status === 'ACKNOWLEDGED' || n.status === 'PROCESSING') acknowledgedCount++;
      if (n.status === 'RESOLVED') resolvedCount++;
    });

    // 6. Get children of targetClass for the quick student picker
    const children = await this.childRepo.find({
      where: { classId: targetClass.id, tenantId, status: 'ACTIVE' },
      relations: ['allergies'],
      order: { studentCode: 'ASC', fullName: 'ASC' },
    });

    const formattedChildren = children.map((c) => {
      const allergy = c.allergies && c.allergies.length > 0
        ? c.allergies.map((a) => a.customAllergenName || a.allergyType).join(', ')
        : undefined;
      return {
        id: c.id,
        fullName: c.fullName,
        studentCode: c.studentCode,
        allergy,
      };
    });

    // 7. Format notes
    const formattedNotes: FormattedCoordinationNote[] = notes.map((n) => {
      let childInfo: FormattedCoordinationNote['child'] = null;
      if (n.child) {
        const nameParts = n.child.fullName.trim().split(' ');
        const avatarLetter = nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() || 'E';
        const allergyWarning = n.child.allergies && n.child.allergies.length > 0
          ? n.child.allergies.map((a) => a.customAllergenName || a.allergyType).join(', ')
          : undefined;

        childInfo = {
          id: n.child.id,
          fullName: n.child.fullName,
          studentCode: n.child.studentCode,
          avatarLetter,
          allergyWarning,
        };
      }

      return {
        id: n.id,
        classId: n.classId,
        className: n.class?.name || targetClass?.name || 'Chồi 1',
        child: childInfo,
        mealDate: typeof n.mealDate === 'string' ? n.mealDate : new Date(n.mealDate).toISOString().split('T')[0],
        mealSession: n.mealSession,
        mealSessionLabel: n.mealSessionLabel || this.getSessionLabel(n.mealSession),
        noteType: n.noteType,
        noteTypeLabel: n.noteTypeLabel || this.getTypeLabel(n.noteType),
        priority: n.priority,
        priorityLabel: this.getPriorityLabel(n.priority),
        status: n.status,
        statusLabel: this.getStatusLabel(n.status),
        title: n.title,
        content: n.content,
        teacherName: n.teacherName || 'Cô Nguyễn Lan Anh',
        targetRole: n.targetRole || 'KITCHEN',
        targetRoleLabel: n.targetRoleLabel || this.getTargetRoleLabel(n.targetRole),
        kitchenAcknowledged: n.kitchenAcknowledged,
        kitchenAcknowledgedBy: n.kitchenAcknowledgedBy,
        kitchenAcknowledgedAt: n.kitchenAcknowledgedAt
          ? new Date(n.kitchenAcknowledgedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : undefined,
        kitchenResponse: n.kitchenResponse,
        photos: n.photos || [],
        createdAt: new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        resolvedAt: n.resolvedAt
          ? new Date(n.resolvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : undefined,
      };
    });

    return {
      selectedClass: {
        id: targetClass.id,
        name: targetClass.name,
        gradeLevel: targetClass.gradeLevel,
        totalStudents: targetClass.children?.length || children.length,
      },
      availableClasses: classes.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        totalStudents: c.children?.length || 0,
      })),
      availableChildren: formattedChildren,
      summary: {
        totalNotes: notes.length,
        urgentCount,
        highCount,
        pendingCount,
        acknowledgedCount,
        resolvedCount,
      },
      filterDate: targetDate,
      notes: formattedNotes,
    };
  }

  async createNote(
    tenantId: string,
    dto: CreateMealCoordinationNoteDto,
  ): Promise<MealCoordinationNoteEntity> {
    const sessionLabel = this.getSessionLabel(dto.mealSession);
    const typeLabel = this.getTypeLabel(dto.noteType);
    const targetRole = dto.targetRole || 'KITCHEN';
    const targetRoleLabel = this.getTargetRoleLabel(targetRole);

    const note = this.noteRepo.create({
      tenantId,
      classId: dto.classId,
      childId: dto.childId || undefined,
      mealDate: dto.mealDate,
      mealSession: dto.mealSession,
      mealSessionLabel: sessionLabel,
      noteType: dto.noteType,
      noteTypeLabel: typeLabel,
      priority: dto.priority,
      status: 'PENDING',
      title: dto.title,
      content: dto.content,
      teacherName: dto.teacherName || 'Cô Nguyễn Lan Anh (GVCN Chồi 1)',
      targetRole,
      targetRoleLabel,
      photos: dto.photos || [],
    });

    const saved = await this.noteRepo.save(note);

    // Sync to daily_meal_attendance if childId is given
    if (dto.childId) {
      try {
        const att = await this.mealAttRepo.findOne({
          where: {
            tenantId,
            childId: dto.childId,
            attendanceDate: dto.mealDate,
          },
        });
        if (att) {
          att.notes = dto.content;
          if (dto.priority === 'URGENT') {
            att.needSpecialAttention = true;
            att.dietaryBadgeText = `[ĐIỀU PHỐI] ${dto.title.slice(0, 30)}`;
          }
          await this.mealAttRepo.save(att);
        }
      } catch (err) {
        console.warn('Attendance sync non-blocking error:', err);
      }
    }

    return saved;
  }

  async updateNote(
    tenantId: string,
    id: string,
    dto: UpdateMealCoordinationNoteDto,
  ): Promise<MealCoordinationNoteEntity> {
    const note = await this.noteRepo.findOne({ where: { id, tenantId } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú điều phối ID ${id}`);
    }

    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content;
    if (dto.priority !== undefined) note.priority = dto.priority;
    if (dto.status !== undefined) note.status = dto.status;
    if (dto.noteType !== undefined) {
      note.noteType = dto.noteType;
      note.noteTypeLabel = this.getTypeLabel(dto.noteType);
    }
    if (dto.mealSession !== undefined) {
      note.mealSession = dto.mealSession;
      note.mealSessionLabel = this.getSessionLabel(dto.mealSession);
    }
    if (dto.kitchenResponse !== undefined) {
      note.kitchenResponse = dto.kitchenResponse;
    }
    if (dto.photos !== undefined) note.photos = dto.photos;

    return this.noteRepo.save(note);
  }

  async acknowledgeNote(
    tenantId: string,
    id: string,
    dto: AcknowledgeCoordinationDto,
  ): Promise<MealCoordinationNoteEntity> {
    const note = await this.noteRepo.findOne({ where: { id, tenantId } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú điều phối ID ${id}`);
    }

    note.kitchenAcknowledged = true;
    note.kitchenAcknowledgedBy = dto.acknowledgedBy || 'Bếp trưởng Trần Văn Bếp';
    note.kitchenAcknowledgedAt = new Date();
    note.status = 'ACKNOWLEDGED';
    if (dto.kitchenResponse) {
      note.kitchenResponse = dto.kitchenResponse;
    }

    return this.noteRepo.save(note);
  }

  async resolveNote(
    tenantId: string,
    id: string,
    dto: ResolveCoordinationDto,
  ): Promise<MealCoordinationNoteEntity> {
    const note = await this.noteRepo.findOne({ where: { id, tenantId } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú điều phối ID ${id}`);
    }

    note.status = 'RESOLVED';
    note.resolvedAt = new Date();
    if (dto.resolutionNote) {
      note.kitchenResponse = note.kitchenResponse
        ? `${note.kitchenResponse}\n[Hoàn tất lúc ${new Date().toLocaleTimeString('vi-VN')}]: ${dto.resolutionNote}`
        : dto.resolutionNote;
    }

    return this.noteRepo.save(note);
  }

  async deleteNote(tenantId: string, id: string): Promise<{ success: boolean; message: string }> {
    const note = await this.noteRepo.findOne({ where: { id, tenantId } });
    if (!note) {
      throw new NotFoundException(`Không tìm thấy ghi chú điều phối ID ${id}`);
    }

    await this.noteRepo.remove(note);
    return { success: true, message: 'Đã xóa ghi chú điều phối thành công' };
  }
}
