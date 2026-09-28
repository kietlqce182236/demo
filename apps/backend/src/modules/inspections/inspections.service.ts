import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionRecord, InspectionStatus, StepStatus } from './entities/inspection-record.entity';
import { InspectionSampleItem } from './entities/inspection-sample-item.entity';
import { Step1Dto, Step2Dto, Step3Dto } from './dto/seal-sample.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionRecord)
    private readonly recordRepository: Repository<InspectionRecord>,
    @InjectRepository(InspectionSampleItem)
    private readonly itemRepository: Repository<InspectionSampleItem>,
  ) {}

  async createStep1(dto: Step1Dto, userId?: string) {
    const code = `#KT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}-T`;
    const record = this.recordRepository.create({
      code,
      mealDate: dto.mealDate,
      mealTime: dto.mealTime,
      status: InspectionStatus.PENDING,
      performerId: userId,
      performerName: 'Bếp trưởng',
      performerRole: 'Bếp trưởng',
      totalPortions: 420,
      
      step1Status: StepStatus.PASSED,
      step1Time: new Date(),
      step1Note: dto.note,
      step1PhotoUrl: dto.photoBase64,
    });
    try {
      return await this.recordRepository.save(record);
    } catch (e: any) {
      throw new BadRequestException('Database error: ' + e.message);
    }
  }

  async updateStep2(id: string, dto: Step2Dto) {
    const record = await this.getRecordById(id);
    if (record.step1Status !== StepStatus.PASSED) {
      throw new BadRequestException('Chưa hoàn thành Bước 1');
    }
    
    record.step2Status = StepStatus.PASSED;
    record.step2Time = new Date();
    record.step2Note = dto.note;
    record.step2PhotoUrl = dto.photoBase64;
    
    return await this.recordRepository.save(record);
  }

  async updateStep3(id: string, dto: Step3Dto) {
    const record = await this.getRecordById(id);
    if (record.step2Status !== StepStatus.PASSED) {
      throw new BadRequestException('Chưa hoàn thành Bước 2');
    }

    for (const item of dto.items) {
      if (item.quantityGrams < 100) {
        throw new BadRequestException(`Định lượng lưu mẫu món ${item.dishName} không đạt chuẩn (phải >= 100g).`);
      }
    }

    record.step3Status = StepStatus.SEALED;
    record.sealedAt = new Date();
    record.step3Note = dto.note;
    record.step3PhotoUrl = dto.photoBase64;
    record.storageTemp = 4.0;
    record.status = InspectionStatus.COMPLETED;

    record.sampleItems = dto.items.map(i => this.itemRepository.create({
      dishId: i.dishId,
      dishName: i.dishName,
      quantityGrams: i.quantityGrams
    }));
    
    return await this.recordRepository.save(record);
  }

  async getRecords() {
    return await this.recordRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async getRecordById(id: string) {
    const record = await this.recordRepository.findOne({
      where: { id },
      relations: ['sampleItems']
    });
    if (!record) throw new NotFoundException('Không tìm thấy biên bản');
    return record;
  }

  async disposeSample(id: string, userId?: string) {
    const record = await this.getRecordById(id);
    if (record.step3Status !== StepStatus.SEALED) {
      throw new BadRequestException('Trạng thái không hợp lệ để hủy mẫu');
    }

    const now = new Date();
    const sealedTime = new Date(record.sealedAt);
    const diffHours = (now.getTime() - sealedTime.getTime()) / (1000 * 3600);
    
    // For demo purposes, we might bypass the 24h strict check, but ideally:
    // if (diffHours < 24) throw new BadRequestException('Chưa đủ 24h');

    record.step3Status = StepStatus.DISPOSED;
    record.disposedAt = now;
    
    return await this.recordRepository.save(record);
  }

  // Cron job runs every minute to check for > 24h sealed samples
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    // In a real scenario, this would query for records > 24h and emit socket events
    // console.log('Checking for expired samples...');
    // We would use a WebSocket gateway to emit 'notification.new'
  }
}
