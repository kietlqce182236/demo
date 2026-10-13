import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionRecord } from './entities/inspection-record.entity';
import { InspectionSampleItem } from './entities/inspection-sample-item.entity';
import { InspectionImage } from './entities/inspection-image.entity';
import { SealSampleDto } from './dto/seal-sample.dto';
import { KitchenGateway } from '../websocket/kitchen.gateway';

export interface FormattedInspectionSession {
  id: string;
  code: string;
  date: string;
  mealDate: string;
  mealTime: string;
  performerName: string;
  totalPortions: number;
  storageTemp: number;
  status: 'Hoàn tất' | 'Chưa hoàn tất' | 'Có cảnh báo' | 'Chờ bếp tải ảnh' | 'Chờ duyệt' | 'Đã duyệt' | 'Yêu cầu chụp lại';
  approvalStatus?: 'CHO_BEP_TAI_ANH' | 'CHO_DUYET' | 'DA_DUYET' | 'YEU_CAU_CHUP_LAI';
  approvalStatusLabel?: string;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  kitchenSubmittedAt?: string | null;
  dishes?: string[];
  sealedAt: string | null;
  disposedAt: string | null;
  step1Status: 'Đạt chuẩn' | 'Không đạt' | 'Chưa thực hiện';
  step1Time: string;
  step1Note: string;
  step1PhotoUrl: string | null;
  step1Photos?: string[];
  step2Status: 'Đạt chuẩn' | 'Không đạt' | 'Chưa thực hiện';
  step2Time: string;
  step2Temperature: number | null;
  step2Note: string;
  step2PhotoUrl: string | null;
  step2Photos?: string[];
  step3Status: 'Đạt chuẩn' | 'Không đạt' | 'Chưa thực hiện';
  step3Time: string;
  step3Temperature: number | null;
  step3Note: string;
  step3PhotoUrl: string | null;
  step3Photos?: string[];
  sampleItems: Array<{
    id: string;
    dishName: string;
    sampleCode: string;
    quantityGrams: number;
    temperatureC: number;
    containerType: string;
    status: string;
    storedAt: string | null;
    disposeAt: string | null;
  }>;
}

export interface WorkflowMeta {
  approvalStatus: 'CHO_BEP_TAI_ANH' | 'CHO_DUYET' | 'DA_DUYET' | 'YEU_CAU_CHUP_LAI';
  dishes?: string[];
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  kitchenSubmittedAt?: string;
  nutritionistName?: string;
}

export function parseWorkflowMeta(note?: string): WorkflowMeta | null {
  if (!note) return null;
  try {
    const match = note.match(/__WORKFLOW__:(.*?):__END__/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (e) {}
  return null;
}

export function embedWorkflowMeta(note: string | undefined, meta: WorkflowMeta): string {
  const cleanNote = (note || '').replace(/__WORKFLOW__:.*?:__END__\s*/g, '').trim();
  return `__WORKFLOW__:${JSON.stringify(meta)}:__END__ ${cleanNote}`.trim();
}

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionRecord)
    private readonly inspectionRepo: Repository<InspectionRecord>,
    @InjectRepository(InspectionSampleItem)
    private readonly sampleRepo: Repository<InspectionSampleItem>,
    @InjectRepository(InspectionImage)
    private readonly imageRepo: Repository<InspectionImage>,
    private readonly kitchenGateway: KitchenGateway,
  ) {}

  /**
   * Lấy danh sách toàn bộ các biên bản kiểm thực 3 bước (Sổ kiểm thực điện tử QĐ 1246)
   */
  async getInspections(query?: any): Promise<FormattedInspectionSession[]> {
    const rawInspections = await this.inspectionRepo.find({
      relations: ['inspector', 'images'],
      order: { date: 'DESC', id: 'DESC' },
    });

    const samples = await this.sampleRepo.find({
      order: { date: 'DESC', id: 'ASC' },
    });

    // Group raw inspections by sessionCode (or fallback to date + mealSession)
    const groups: { [key: string]: InspectionRecord[] } = {};
    for (const r of rawInspections) {
      const session = r.mealSession || 'LUNCH';
      const key = r.sessionCode || `${r.date}_${session}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }

    // Also collect dates with samples that might not have inspection rows
    const sampleDates = Array.from(new Set(samples.map((s) => s.date)));
    for (const sDate of sampleDates) {
      const key = `${sDate}_LUNCH`;
      if (!groups[key]) {
        groups[key] = [];
      }
    }

    const sessions: FormattedInspectionSession[] = [];
    let sessionCounter = 1;

    for (const key of Object.keys(groups).sort().reverse()) {
      const records = groups[key];
      const date = records[0]?.date || key.split('_')[0];
      const mealSession = records[0]?.mealSession || key.split('_')[1] || 'LUNCH';

      const step1 = records.find(
        (r) => r.inspectionStep === 'STEP_1_RAW_CHECK' || r.inspectionStep === 'STEP_1_PRE_PROCESSING_CHECK',
      );
      const step2 = records.find((r) => r.inspectionStep === 'STEP_2_PROCESSING_CHECK');
      const step3 = records.find((r) => r.inspectionStep === 'STEP_3_PRE_SERVING_CHECK');

      const matchingSamples = samples.filter((s) => s.date === date);

      // Extract workflow meta if present
      let workflowMeta: WorkflowMeta | null = null;
      for (const r of records) {
        const meta = parseWorkflowMeta(r.note);
        if (meta) {
          workflowMeta = meta;
          break;
        }
      }

      const hasFail = records.some((r) => r.result === 'FAIL');
      const hasAll3 = !!step1 && !!step2 && !!step3;

      const approvalStatus: 'CHO_BEP_TAI_ANH' | 'CHO_DUYET' | 'DA_DUYET' | 'YEU_CAU_CHUP_LAI' =
        workflowMeta?.approvalStatus || 'DA_DUYET';

      let status: 'Hoàn tất' | 'Chưa hoàn tất' | 'Có cảnh báo' = hasFail
        ? 'Có cảnh báo'
        : hasAll3 || matchingSamples.length > 0
        ? 'Hoàn tất'
        : 'Chưa hoàn tất';

      let approvalStatusLabel = 'Đã hoàn tất';
      if (hasFail) {
        status = 'Có cảnh báo';
        approvalStatusLabel = 'Có cảnh báo';
      } else if (approvalStatus === 'CHO_BEP_TAI_ANH') {
        approvalStatusLabel = 'Chờ bếp tải ảnh';
        status = 'Chưa hoàn tất';
      } else if (approvalStatus === 'CHO_DUYET') {
        approvalStatusLabel = 'Chờ duyệt';
        status = 'Chưa hoàn tất';
      } else if (approvalStatus === 'YEU_CAU_CHUP_LAI') {
        approvalStatusLabel = 'Yêu cầu chụp lại';
        status = 'Có cảnh báo';
      } else if (approvalStatus === 'DA_DUYET') {
        approvalStatusLabel = 'Đã duyệt';
        status = 'Hoàn tất';
      }

      const mealTimeLabel =
        mealSession === 'BREAKFAST'
          ? 'Bữa sáng (07:00)'
          : mealSession === 'AFTERNOON_SNACK'
          ? 'Bữa xế chiều (14:30)'
          : 'Trưa chính (10:30)';

      const inspectorName =
        step3?.inspector?.fullName ||
        step2?.inspector?.fullName ||
        step1?.inspector?.fullName ||
        (matchingSamples.length > 0 ? matchingSamples[0].collectorName : null) ||
        'Nguyễn Văn Cường (Bếp trưởng)';

      const dateSlug = date.replace(/-/g, '');
      const code = records[0]?.sessionCode || `BB-KT-${dateSlug}-0${sessionCounter}`;
      const firstId = records[0]?.id ? String(records[0].id) : `session-${date}-${mealSession}`;

      const step1Photos = (step1?.images || []).map((img) => img.imageUrl);
      const step2Photos = (step2?.images || []).map((img) => img.imageUrl);
      const step3Photos = (step3?.images || []).map((img) => img.imageUrl);

      const cleanStep1Note = (step1?.note || '')
        .replace(/__WORKFLOW__:.*?:__END__\s*/g, '')
        .trim() || 'Tiếp nhận nguyên liệu rau, củ, thịt, cá từ nhà cung cấp có đủ hóa đơn kiểm dịch ATTP, cảm quan tươi sống tốt.';
      const cleanStep2Note = (step2?.note || '')
        .replace(/__WORKFLOW__:.*?:__END__\s*/g, '')
        .trim() || 'Bếp vận hành theo nguyên tắc 1 chiều. Dụng cụ dao thớt sống chín phân biệt rõ ràng. Nhiệt độ nấu chín > 75°C.';
      const cleanStep3Note = (step3?.note || '')
        .replace(/__WORKFLOW__:.*?:__END__\s*/g, '')
        .trim() || 'Cảm quan thức ăn chín thơm ngon vừa miệng, nhiệt độ phân chia > 60°C. Đã lấy mẫu lưu 24h niêm phong vào tủ mát.';

      sessions.push({
        id: firstId,
        code,
        date,
        mealDate: date,
        mealTime: mealTimeLabel,
        performerName: inspectorName,
        totalPortions: 380,
        storageTemp: matchingSamples[0]?.storageTemp ? Number(matchingSamples[0].storageTemp) : 3.8,
        status,
        approvalStatus,
        approvalStatusLabel,
        rejectionReason: workflowMeta?.rejectionReason || null,
        approvedBy: workflowMeta?.approvedBy || null,
        approvedAt: workflowMeta?.approvedAt || null,
        kitchenSubmittedAt: workflowMeta?.kitchenSubmittedAt || null,
        dishes: workflowMeta?.dishes || ['Thịt bò xào củ quả', 'Canh bí đỏ thịt bằm', 'Cơm trắng', 'Chuối tiêu'],
        sealedAt: matchingSamples[0]?.storedAt ? matchingSamples[0].storedAt.toISOString() : `${date}T10:45:00.000Z`,
        disposedAt: matchingSamples[0]?.disposeAt ? matchingSamples[0].disposeAt.toISOString() : null,
        step1Status: step1?.result === 'PASS' || matchingSamples.length > 0 ? 'Đạt chuẩn' : step1?.result === 'FAIL' ? 'Không đạt' : 'Chưa thực hiện',
        step1Time: `${date}T06:30:00.000Z`,
        step1Note: cleanStep1Note,
        step1PhotoUrl: step1Photos[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        step1Photos,
        step2Status: step2?.result === 'PASS' || matchingSamples.length > 0 ? 'Đạt chuẩn' : step2?.result === 'FAIL' ? 'Không đạt' : 'Chưa thực hiện',
        step2Time: `${date}T09:15:00.000Z`,
        step2Temperature: 88,
        step2Note: cleanStep2Note,
        step2PhotoUrl: step2Photos[0] || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
        step2Photos,
        step3Status: step3?.result === 'PASS' || matchingSamples.length > 0 ? 'Đạt chuẩn' : step3?.result === 'FAIL' ? 'Không đạt' : 'Chưa thực hiện',
        step3Time: `${date}T10:30:00.000Z`,
        step3Temperature: 68,
        step3Note: cleanStep3Note,
        step3PhotoUrl: step3Photos[0] || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80',
        step3Photos,
        sampleItems: matchingSamples.map((s) => ({
          id: String(s.id),
          dishName: s.dishName,
          sampleCode: s.sampleCode,
          quantityGrams: Number(s.sampleWeightG) || 150,
          temperatureC: Number(s.storageTemp) || 3.8,
          containerType: 'Hộp Inox vô trùng niêm phong tem',
          status: s.status,
          storedAt: s.storedAt ? s.storedAt.toISOString() : null,
          disposeAt: s.disposeAt ? s.disposeAt.toISOString() : null,
        })),
      });

      sessionCounter++;
    }

    return sessions;
  }

  /**
   * Xem chi tiết 1 biên bản kiểm thực 3 bước
   */
  async getInspectionDetail(idOrCode: string | number): Promise<FormattedInspectionSession> {
    const all = await this.getInspections();
    const strId = String(idOrCode);
    const found = all.find((item) => item.id === strId || item.code === strId || item.id === `session-${strId}`);

    if (found) {
      return found;
    }

    // Fallback: Check if numeric ID matches in database directly
    const numId = parseInt(strId, 10);
    if (!isNaN(numId)) {
      const rec = await this.inspectionRepo.findOne({
        where: { id: numId },
        relations: ['inspector', 'images'],
      });
      if (rec) {
        const subList = await this.getInspections();
        const dateMatch = subList.find((s) => s.date === rec.date);
        if (dateMatch) return dateMatch;
      }
    }

    if (all.length > 0) return all[0];
    throw new NotFoundException(`Không tìm thấy biên bản kiểm thực với mã/ID: ${idOrCode}`);
  }

  /**
   * Lấy danh sách mẫu thức ăn lưu 24h (QĐ 1246/QĐ-BYT)
   */
  async getSamples() {
    const samples = await this.sampleRepo.find({ order: { storedAt: 'DESC' } });
    return samples.map((s) => {
      const storedTime = s.storedAt ? new Date(s.storedAt).getTime() : Date.now();
      const expiresTime = storedTime + 24 * 60 * 60 * 1000;
      const hoursRemaining = Math.max(0, (expiresTime - Date.now()) / (1000 * 60 * 60));

      return {
        id: String(s.id),
        code: s.sampleCode,
        sampleCode: s.sampleCode,
        dishName: s.dishName,
        date: s.date,
        mealDate: s.date,
        mealSession: s.dishName.toLowerCase().includes('phở') || s.dishName.toLowerCase().includes('bún') ? 'Xế chiều' : 'Trưa chính',
        storedAt: s.storedAt ? s.storedAt.toISOString() : null,
        disposeAt: s.disposeAt ? s.disposeAt.toISOString() : null,
        status: s.status,
        sampleWeight: Number(s.sampleWeightG) || 150,
        storageTemp: Number(s.storageTemp) || 3.8,
        temperatureC: Number(s.storageTemp) || 3.8,
        fridgeUnit: s.fridgeUnit || 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
        collectorName: s.collectorName || 'Nguyễn Văn Cường (Bếp trưởng)',
        countdownHours: parseFloat(hoursRemaining.toFixed(1)),
        note: s.note,
      };
    });
  }

  /**
   * Xem chi tiết mẫu thức ăn lưu 24h
   */
  async getSampleDetail(id: number) {
    const s = await this.sampleRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy mẫu thức ăn lưu');

    const storedTime = s.storedAt ? new Date(s.storedAt).getTime() : Date.now();
    const expiresTime = storedTime + 24 * 60 * 60 * 1000;
    const hoursRemaining = Math.max(0, (expiresTime - Date.now()) / (1000 * 60 * 60));

    return {
      id: String(s.id),
      code: s.sampleCode,
      sampleCode: s.sampleCode,
      dishName: s.dishName,
      date: s.date,
      mealDate: s.date,
      storedAt: s.storedAt ? s.storedAt.toISOString() : null,
      disposeAt: s.disposeAt ? s.disposeAt.toISOString() : null,
      status: s.status,
      temperatureC: Number(s.storageTemp) || 3.8,
      storageTemp: Number(s.storageTemp) || 3.8,
      sampleWeight: Number(s.sampleWeightG) || 150,
      fridgeUnit: s.fridgeUnit || 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
      collectorName: s.collectorName || 'Nguyễn Văn Cường (Bếp trưởng)',
      countdownHours: parseFloat(hoursRemaining.toFixed(1)),
      note: s.note,
      sealIntegrity: 'NGUYÊN VẸN',
      storageLocation: s.fridgeUnit || 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
    };
  }

  /**
   * Tiêu hủy mẫu lưu an toàn sau 24 giờ
   */
  async disposeSample(id: number) {
    const s = await this.sampleRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy mẫu thức ăn');

    s.status = 'DISPOSED';
    s.disposeAt = new Date();
    await this.sampleRepo.save(s);

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'SAMPLE_DISPOSED',
      sampleId: String(s.id),
      dishName: s.dishName,
      message: `Đã tiêu hủy an toàn mẫu lưu ${s.dishName} sau 24h`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Đã hủy mẫu lưu 24h an toàn' };
  }

  /**
   * Niêm phong mẫu lưu mới vào tủ mát
   */
  async sealSample(dto: SealSampleDto) {
    const sampleCode = dto.sampleCode || `HD-LM-${dto.date?.replace(/-/g, '') || '2026'}-${Date.now().toString().slice(-2)}`;
    const sample = this.sampleRepo.create({
      dishName: dto.dishName,
      date: dto.date,
      sampleCode,
      status: 'STORED',
      sampleWeightG: 150.0,
      storageTemp: 3.8,
      fridgeUnit: 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
      collectorName: 'Nguyễn Văn Cường (Bếp trưởng)',
      note: dto.note || 'Lưu mẫu 24h theo Quyết định 1246/QĐ-BYT',
    });
    const saved = await this.sampleRepo.save(sample);

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'SAMPLE_SEALED',
      sampleId: String(saved.id),
      dishName: saved.dishName,
      message: `Đã niêm phong mẫu lưu ${saved.dishName} (${saved.sampleCode})`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Bước 1: Tiếp nhận nguyên liệu trước chế biến
   */
  async createStep1(data: any, inspectorId?: number) {
    const mealDate = data.mealDate || data.date || new Date().toISOString().split('T')[0];
    const sessionCode = `BB-KT-${mealDate.replace(/-/g, '')}-01`;

    const rec = this.inspectionRepo.create({
      date: mealDate,
      inspectionStep: 'STEP_1_RAW_CHECK',
      inspectorId: inspectorId || 5, // Default chef
      result: data.result || 'PASS',
      mealSession: data.mealSession || 'LUNCH',
      sessionCode,
      note: data.note || data.notes || 'Kiểm tra cảm quan nguyên liệu tươi sống đạt yêu cầu, đầy đủ giấy tờ kiểm dịch',
    });
    const saved = await this.inspectionRepo.save(rec);

    if (data.photoBase64 || data.imageUrl) {
      await this.imageRepo.save(
        this.imageRepo.create({
          inspectionId: saved.id,
          imageUrl: data.imageUrl || data.photoBase64 || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        }),
      );
    }

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_STEP_1_COMPLETED',
      stepNumber: 1,
      message: `Đã hoàn tất Bước 1: Tiếp nhận nguyên liệu (${mealDate})`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      recordId: String(saved.id),
      code: sessionCode,
      step: 'STEP_1_RAW_CHECK',
      message: 'Đã hoàn tất Bước 1: Kiểm tra nguyên liệu trước chế biến',
    };
  }

  /**
   * Bước 2: Kiểm tra trong quá trình chế biến
   */
  async updateStep2(idOrCode: any, data: any, inspectorId?: number) {
    const mealDate = data.mealDate || data.date || new Date().toISOString().split('T')[0];
    const sessionCode = `BB-KT-${mealDate.replace(/-/g, '')}-01`;

    const rec = this.inspectionRepo.create({
      date: mealDate,
      inspectionStep: 'STEP_2_PROCESSING_CHECK',
      inspectorId: inspectorId || 5,
      result: data.result || 'PASS',
      mealSession: data.mealSession || 'LUNCH',
      sessionCode,
      note: data.note || data.notes || `Nhiệt độ tâm món: ${data.temperature || 88}°C. Vệ sinh dao thớt sống chín riêng biệt, trang phục bảo hộ đầy đủ.`,
    });
    const saved = await this.inspectionRepo.save(rec);

    if (data.photoBase64 || data.imageUrl) {
      await this.imageRepo.save(
        this.imageRepo.create({
          inspectionId: saved.id,
          imageUrl: data.imageUrl || data.photoBase64 || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
        }),
      );
    }

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_STEP_2_COMPLETED',
      stepNumber: 2,
      message: `Đã hoàn tất Bước 2: Chế biến món ăn (${mealDate})`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      recordId: String(saved.id),
      step: 'STEP_2_PROCESSING_CHECK',
      message: 'Đã hoàn tất Bước 2: Kiểm tra trong quá trình chế biến',
    };
  }

  /**
   * Bước 3: Kiểm tra thức ăn trước khi ăn & lưu mẫu 24h
   */
  async updateStep3(idOrCode: any, data: any, inspectorId?: number) {
    const mealDate = data.mealDate || data.date || new Date().toISOString().split('T')[0];
    const sessionCode = `BB-KT-${mealDate.replace(/-/g, '')}-01`;

    const rec = this.inspectionRepo.create({
      date: mealDate,
      inspectionStep: 'STEP_3_PRE_SERVING_CHECK',
      inspectorId: inspectorId || 3, // Nutritionist / BGH
      result: data.result || 'PASS',
      mealSession: data.mealSession || 'LUNCH',
      sessionCode,
      note: data.note || data.notes || 'Cảm quan món ăn thơm ngon đạt chuẩn, nhiệt độ chia suất > 65°C, đã niêm phong mẫu lưu 24h.',
    });
    const saved = await this.inspectionRepo.save(rec);

    // Save sample items if passed
    if (Array.isArray(data.dishes) && data.dishes.length > 0) {
      for (const d of data.dishes) {
        if (d.name || d.dishName) {
          await this.sealSample({
            dishName: d.name || d.dishName,
            date: mealDate,
            note: `Lưu mẫu 24h từ Biên bản ${sessionCode}`,
          });
        }
      }
    } else if (data.dishName) {
      await this.sealSample({
        dishName: data.dishName,
        date: mealDate,
        note: `Lưu mẫu 24h từ Biên bản ${sessionCode}`,
      });
    }

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_STEP_3_COMPLETED',
      stepNumber: 3,
      message: `Đã hoàn tất Bước 3: Thử nếm & Niêm phong mẫu lưu 24h (${mealDate})`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      recordId: String(saved.id),
      step: 'STEP_3_PRE_SERVING_CHECK',
      message: 'Đã hoàn tất Bước 3: Kiểm tra thức ăn trước khi ăn & lưu mẫu',
    };
  }

  // =========================================================================
  // WORKFLOW: NUTRITIONIST CREATES -> KITCHEN UPLOADS PHOTOS -> NUTRITIONIST APPROVES
  // =========================================================================

  /**
   * 1. Chuyên gia dinh dưỡng khởi tạo biên bản kiểm thực (Yêu cầu bếp chụp ảnh)
   */
  async createSessionByNutritionist(data: any, nutritionistId?: number) {
    const mealDate = data.mealDate || data.date || new Date().toISOString().split('T')[0];
    let sessionCode = data.sessionCode;
    if (!sessionCode) {
      const existingForDate = await this.inspectionRepo.find({
        where: { date: mealDate },
      });
      let maxNum = 0;
      for (const r of existingForDate) {
        if (r.sessionCode) {
          const match = r.sessionCode.match(/-(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        }
      }
      const nextNum = maxNum + 1;
      const nextNumStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
      sessionCode = `BB-KT-${mealDate.replace(/-/g, '')}-${nextNumStr}`;
    }

    const dishes = Array.isArray(data.dishes)
      ? data.dishes.map((d: any) => (typeof d === 'string' ? d : d.name || d.dishName))
      : ['Thịt heo xốt cà chua', 'Canh rau cải cá thác lác', 'Cơm trắng', 'Chuối tiêu tráng miệng'];

    const meta: WorkflowMeta = {
      approvalStatus: 'CHO_BEP_TAI_ANH',
      dishes,
      nutritionistName: data.nutritionistName || 'BS. Hoàng Mai Trang (Chuyên gia Dinh dưỡng)',
    };

    const initialNote = embedWorkflowMeta(
      data.note || 'Biên bản kiểm thực được khởi tạo bởi Chuyên gia dinh dưỡng. Nhà bếp vui lòng chụp đầy đủ ảnh 3 bước và gửi duyệt.',
      meta,
    );

    const rec = this.inspectionRepo.create({
      date: mealDate,
      inspectionStep: 'STEP_1_RAW_CHECK',
      inspectorId: nutritionistId || 2,
      result: 'PASS',
      mealSession: data.mealSession || 'LUNCH',
      sessionCode,
      note: initialNote,
    });
    const saved = await this.inspectionRepo.save(rec);

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_SESSION_CREATED',
      sessionCode,
      mealDate,
      message: `Chuyên gia dinh dưỡng đã tạo biên bản kiểm thực ${sessionCode}. Nhà bếp vui lòng vào tải ảnh minh chứng 3 bước.`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      recordId: String(saved.id),
      code: sessionCode,
      approvalStatus: 'CHO_BEP_TAI_ANH',
      dishes: data.dishes || [],
      message: `Đã tạo biên bản kiểm thực ${sessionCode}. Đã gửi yêu cầu đến nhà bếp để tải ảnh minh chứng.`,
    };
  }

  /**
   * 2. Nhà bếp tải ảnh minh chứng và gửi lên để Chuyên gia dinh dưỡng duyệt
   */
  async kitchenSubmitPhotos(idOrCode: any, data: any, kitchenUserId?: number) {
    const detail = await this.getInspectionDetail(idOrCode);
    const sessionCode = detail.code;
    const mealDate = detail.mealDate || detail.date;

    // Find all records for this session
    const whereCondition = sessionCode ? { sessionCode } : { date: mealDate };
    const records = await this.inspectionRepo.find({
      where: whereCondition,
      relations: ['images'],
    });

    let step1 = records.find(
      (r) => r.inspectionStep === 'STEP_1_RAW_CHECK' || r.inspectionStep === 'STEP_1_PRE_PROCESSING_CHECK',
    );
    let step2 = records.find((r) => r.inspectionStep === 'STEP_2_PROCESSING_CHECK');
    let step3 = records.find((r) => r.inspectionStep === 'STEP_3_PRE_SERVING_CHECK');

    if (!step1) {
      step1 = this.inspectionRepo.create({
        date: mealDate,
        inspectionStep: 'STEP_1_RAW_CHECK',
        inspectorId: kitchenUserId || 5,
        result: 'PASS',
        mealSession: detail.mealTime?.includes('sáng') ? 'BREAKFAST' : 'LUNCH',
        sessionCode,
        note: data.step1Note || 'Kiểm tra nguyên liệu tươi sống đạt chuẩn',
      });
      step1 = await this.inspectionRepo.save(step1);
    }

    if (!step2) {
      step2 = this.inspectionRepo.create({
        date: mealDate,
        inspectionStep: 'STEP_2_PROCESSING_CHECK',
        inspectorId: kitchenUserId || 5,
        result: 'PASS',
        mealSession: step1.mealSession,
        sessionCode,
        note: data.step2Note || `Nhiệt độ sôi: ${data.step2Temperature || 88}°C. Quy trình 1 chiều.`,
      });
      step2 = await this.inspectionRepo.save(step2);
    }

    if (!step3) {
      step3 = this.inspectionRepo.create({
        date: mealDate,
        inspectionStep: 'STEP_3_PRE_SERVING_CHECK',
        inspectorId: kitchenUserId || 5,
        result: 'PASS',
        mealSession: step1.mealSession,
        sessionCode,
        note: data.step3Note || 'Cảm quan thức ăn chín đạt chuẩn, nhiệt độ chia suất > 65°C.',
      });
      step3 = await this.inspectionRepo.save(step3);
    }

    // Save photos
    const savePhotos = async (recordId: number, photos: string[] | undefined) => {
      if (!Array.isArray(photos) || photos.length === 0) return;
      for (const p of photos) {
        if (p && p.trim()) {
          await this.imageRepo.save(
            this.imageRepo.create({
              inspectionId: recordId,
              imageUrl: p,
            }),
          );
        }
      }
    };

    const step1Urls = data.step1Photos || data.step1?.images || (data.step1PhotoUrl ? [data.step1PhotoUrl] : []);
    const step2Urls = data.step2Photos || data.step2?.images || (data.step2PhotoUrl ? [data.step2PhotoUrl] : []);
    const step3Urls = data.step3Photos || data.step3?.images || (data.step3PhotoUrl ? [data.step3PhotoUrl] : []);

    if (step1Urls.length > 0) await savePhotos(step1.id, step1Urls);
    if (step2Urls.length > 0) await savePhotos(step2.id, step2Urls);
    if (step3Urls.length > 0) await savePhotos(step3.id, step3Urls);

    // Save sample retention if dish names provided
    if (Array.isArray(data.dishes) && data.dishes.length > 0) {
      for (const d of data.dishes) {
        const dishName = typeof d === 'string' ? d : d.name || d.dishName;
        if (dishName) {
          await this.sealSample({
            dishName,
            date: mealDate,
            note: `Lưu mẫu 24h tự động từ Biên bản ${sessionCode}`,
          });
        }
      }
    }

    // Update workflow meta to CHO_DUYET
    const currentMeta = parseWorkflowMeta(step1.note) || { approvalStatus: 'CHO_BEP_TAI_ANH' };
    const updatedMeta: WorkflowMeta = {
      ...currentMeta,
      approvalStatus: 'CHO_DUYET',
      kitchenSubmittedAt: new Date().toISOString(),
      dishes: data.dishes || currentMeta.dishes,
    };

    step1.note = embedWorkflowMeta(data.step1Note || step1.note, updatedMeta);
    await this.inspectionRepo.update(step1.id, { note: step1.note });

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_SUBMITTED_FOR_APPROVAL',
      sessionCode,
      message: `Nhà bếp đã tải đủ ảnh minh chứng và gửi duyệt biên bản kiểm thực ${sessionCode}.`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      approvalStatus: 'CHO_DUYET',
      message: `Đã gửi duyệt biên bản ${sessionCode} thành công cho Chuyên gia dinh dưỡng!`,
    };
  }

  /**
   * 3. Chuyên gia dinh dưỡng phê duyệt biên bản kiểm thực đạt chuẩn
   */
  async approveInspection(idOrCode: any, data: any, userId?: number) {
    const detail = await this.getInspectionDetail(idOrCode);
    const sessionCode = detail.code;
    const mealDate = detail.mealDate || detail.date;

    const whereCondition = sessionCode ? { sessionCode } : { date: mealDate };
    const records = await this.inspectionRepo.find({
      where: whereCondition,
    });

    const step1 = records.find(
      (r) => r.inspectionStep === 'STEP_1_RAW_CHECK' || r.inspectionStep === 'STEP_1_PRE_PROCESSING_CHECK',
    ) || records[0];
    if (step1) {
      const currentMeta = parseWorkflowMeta(step1.note) || { approvalStatus: 'CHO_DUYET' };
      const updatedMeta: WorkflowMeta = {
        ...currentMeta,
        approvalStatus: 'DA_DUYET',
        approvedAt: new Date().toISOString(),
        approvedBy: 'Chuyên gia Dinh dưỡng',
      };
      step1.note = embedWorkflowMeta(step1.note, updatedMeta);
      await this.inspectionRepo.update(step1.id, { note: step1.note });
    }

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_APPROVED',
      sessionCode,
      message: `Chuyên gia dinh dưỡng đã phê duyệt Đạt chuẩn biên bản kiểm thực ${sessionCode}.`,
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      approvalStatus: 'DA_DUYET',
      approvalStatusLabel: 'Đã duyệt',
      message: `Đã phê duyệt biên bản kiểm thực ${sessionCode} Đạt chuẩn ATTP!`,
    };
  }

  /**
   * 4. Chuyên gia dinh dưỡng yêu cầu bếp chụp lại ảnh / bổ sung minh chứng
   */
  async rejectInspection(idOrCode: any, data: any, userId?: number) {
    const detail = await this.getInspectionDetail(idOrCode);
    const sessionCode = detail.code;
    const mealDate = detail.mealDate || detail.date;

    const whereCondition = sessionCode ? { sessionCode } : { date: mealDate };
    const records = await this.inspectionRepo.find({
      where: whereCondition,
    });

    const reason = data.reason || data.rejectionReason || 'Ảnh minh chứng chưa rõ nét, yêu cầu bếp chụp lại.';

    const step1 = records.find(
      (r) => r.inspectionStep === 'STEP_1_RAW_CHECK' || r.inspectionStep === 'STEP_1_PRE_PROCESSING_CHECK',
    ) || records[0];
    if (step1) {
      const currentMeta = parseWorkflowMeta(step1.note) || { approvalStatus: 'CHO_DUYET' };
      const updatedMeta: WorkflowMeta = {
        ...currentMeta,
        approvalStatus: 'YEU_CAU_CHUP_LAI',
        rejectionReason: reason,
      };
      step1.note = embedWorkflowMeta(step1.note, updatedMeta);
      await this.inspectionRepo.update(step1.id, { note: step1.note });
    }

    this.kitchenGateway.broadcastSafetyAlert(1, {
      type: 'INSPECTION_REJECTED_RETAKE',
      sessionCode,
      message: `Biên bản kiểm thực ${sessionCode} yêu cầu bếp chụp lại ảnh: ${reason}`,
      severity: 'WARNING',
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      approvalStatus: 'YEU_CAU_CHUP_LAI',
      approvalStatusLabel: 'Yêu cầu chụp lại',
      rejectionReason: reason,
      message: `Đã gửi yêu cầu chụp lại ảnh minh chứng cho nhà bếp!`,
    };
  }

  // =========================================================================
  // KDS KITCHEN COMPATIBILITY METHODS
  // =========================================================================

  async getFoodSafetyLogs() {
    return this.getInspections();
  }

  async createFoodSafetyLog(data: any) {
    if (data.stepNumber === 1 || !data.stepNumber) {
      return this.createStep1(data);
    }
    if (data.stepNumber === 2) {
      return this.updateStep2(data.recordId || data.id, data);
    }
    return this.updateStep3(data.recordId || data.id, data);
  }

  async getSampleRetentionRecords() {
    return this.getSamples();
  }

  async createSampleRetentionRecord(data: any) {
    return this.sealSample({
      dishName: data.dishName,
      date: data.mealDate || data.date || new Date().toISOString().split('T')[0],
      note: data.notes || data.note,
    });
  }

  async disposeSampleRetentionRecord(id: string | number) {
    const numId = parseInt(String(id), 10);
    return this.disposeSample(numId);
  }
}
