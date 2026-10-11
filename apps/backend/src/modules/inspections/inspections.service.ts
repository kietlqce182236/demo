import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionRecord } from './entities/inspection-record.entity';
import { InspectionSampleItem } from './entities/inspection-sample-item.entity';
import { SealSampleDto } from './dto/seal-sample.dto';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionRecord)
    private readonly inspectionRepo: Repository<InspectionRecord>,
    @InjectRepository(InspectionSampleItem)
    private readonly sampleRepo: Repository<InspectionSampleItem>,
  ) {}

  async getSamples() {
    const samples = await this.sampleRepo.find({ order: { storedAt: 'DESC' } });
    return samples.map((s) => ({
      id: String(s.id),
      sampleCode: s.sampleCode,
      dishName: s.dishName,
      date: s.date,
      storedAt: s.storedAt ? s.storedAt.toISOString() : null,
      disposeAt: s.disposeAt ? s.disposeAt.toISOString() : null,
      status: s.status,
      temperatureC: 4,
      note: s.note,
    }));
  }

  async getSampleDetail(id: number) {
    const s = await this.sampleRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy mẫu thức ăn lưu');

    return {
      id: String(s.id),
      sampleCode: s.sampleCode,
      dishName: s.dishName,
      date: s.date,
      storedAt: s.storedAt ? s.storedAt.toISOString() : null,
      disposeAt: s.disposeAt ? s.disposeAt.toISOString() : null,
      status: s.status,
      temperatureC: 4,
      note: s.note,
      sealIntegrity: 'NGUYÊN VẸN',
      storageLocation: 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
    };
  }

  async disposeSample(id: number) {
    const s = await this.sampleRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy mẫu thức ăn');

    s.status = 'DISPOSED';
    s.disposeAt = new Date();
    await this.sampleRepo.save(s);

    return { success: true, message: 'Đã hủy mẫu lưu 24h an toàn' };
  }

  async sealSample(dto: SealSampleDto) {
    const sampleCode = dto.sampleCode || `SAMPLE-${Date.now().toString().slice(-6)}`;
    const sample = this.sampleRepo.create({
      dishName: dto.dishName,
      date: dto.date,
      sampleCode,
      status: 'STORED',
      note: dto.note || 'Lưu mẫu 24h theo Quyết định 1246/QĐ-BYT',
    });
    return this.sampleRepo.save(sample);
  }

  async createStep1(data: any, inspectorId?: number) {
    const rec = this.inspectionRepo.create({
      date: data.date || new Date().toISOString().split('T')[0],
      inspectionStep: 'STEP_1_RAW_CHECK',
      inspectorId: inspectorId || 5, // Default kitchen chef
      result: data.result || 'PASS',
      note: data.note || 'Kiểm tra cảm quan nguyên liệu tươi sống đạt yêu cầu',
    });
    const saved = await this.inspectionRepo.save(rec);
    return {
      success: true,
      recordId: String(saved.id),
      step: 'STEP_1_RAW_CHECK',
      message: 'Đã hoàn tất Bước 1: Kiểm tra nguyên liệu trước chế biến',
    };
  }

  async updateStep2(id: number, data: any, inspectorId?: number) {
    const rec = this.inspectionRepo.create({
      date: data.date || new Date().toISOString().split('T')[0],
      inspectionStep: 'STEP_2_PROCESSING_CHECK',
      inspectorId: inspectorId || 5,
      result: data.result || 'PASS',
      note: data.note || 'Kiểm tra quá trình chế biến đạt nhiệt độ chín và vệ sinh',
    });
    const saved = await this.inspectionRepo.save(rec);
    return {
      success: true,
      recordId: String(saved.id),
      step: 'STEP_2_PROCESSING_CHECK',
      message: 'Đã hoàn tất Bước 2: Kiểm tra trong quá trình chế biến',
    };
  }

  async updateStep3(id: number, data: any, inspectorId?: number) {
    const rec = this.inspectionRepo.create({
      date: data.date || new Date().toISOString().split('T')[0],
      inspectionStep: 'STEP_3_PRE_SERVING_CHECK',
      inspectorId: inspectorId || 5,
      result: data.result || 'PASS',
      note: data.note || 'Kiểm tra trước khi ăn và niêm phong mẫu lưu 24h',
    });
    const saved = await this.inspectionRepo.save(rec);

    if (data.dishName) {
      await this.sealSample({
        dishName: data.dishName,
        date: rec.date,
        note: 'Niêm phong mẫu lưu từ Bước 3',
      });
    }

    return {
      success: true,
      recordId: String(saved.id),
      step: 'STEP_3_PRE_SERVING_CHECK',
      message: 'Đã hoàn tất Bước 3: Kiểm tra thức ăn trước khi chia và lưu mẫu',
    };
  }
}
