import { Injectable } from '@nestjs/common';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';

export interface AuditLogItem {
  id: string;
  tenantId: string | null;
  userId: string;
  userEmail: string | null;
  action: string;
  targetEntity: string | null;
  targetId: string | null;
  ipAddress: string | null;
  details: any;
  createdAt: string;
}

@Injectable()
export class AuditLogsService {
  private logs: AuditLogItem[] = [
    {
      id: 'log-101',
      tenantId: '1',
      userId: '2',
      userEmail: 'nutritionist@huongduong.edu.vn',
      action: 'APPROVE_MENU',
      targetEntity: 'MENU',
      targetId: '4',
      ipAddress: '192.168.1.45',
      details: {
        note: 'Duyệt thực đơn Tuần 2 tháng 9 - Đạt chuẩn P:L:G Thông tư 28',
        weekStartDate: '2026-09-08',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'log-102',
      tenantId: '1',
      userId: '4',
      userEmail: 'kitchen@huongduong.edu.vn',
      action: 'FOOD_INSPECTION_STEP1',
      targetEntity: 'FOOD_INSPECTION',
      targetId: '12',
      ipAddress: '192.168.1.80',
      details: {
        step: 1,
        stepName: 'Kiểm tra trước khi chế biến',
        result: 'PASSED',
        itemsInspected: 8,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'log-103',
      tenantId: '1',
      userId: '4',
      userEmail: 'kitchen@huongduong.edu.vn',
      action: 'RETAIN_FOOD_SAMPLE',
      targetEntity: 'FOOD_SAMPLE',
      targetId: '6',
      ipAddress: '192.168.1.80',
      details: {
        sampleCode: 'LM-20260908-01',
        dishName: 'Thịt bò xào củ quả',
        storageTemp: '3.5°C',
        retentionDuration: '24h',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'log-104',
      tenantId: '1',
      userId: '5',
      userEmail: 'parent@huongduong.edu.vn',
      action: 'SUBMIT_PAYMENT',
      targetEntity: 'PAYMENT',
      targetId: '25',
      ipAddress: '14.161.22.10',
      details: {
        service: 'Dịch vụ Ăn xế 17h',
        amount: 350000,
        provider: 'VNPAY',
        status: 'SUCCESS',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'log-105',
      tenantId: '1',
      userId: '3',
      userEmail: 'teacher@huongduong.edu.vn',
      action: 'RECORD_ATTENDANCE',
      targetEntity: 'ATTENDANCE',
      targetId: '88',
      ipAddress: '192.168.1.92',
      details: {
        className: 'Mầm 1',
        headcountLunch: 24,
        headcountSnack: 20,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
    {
      id: 'log-106',
      tenantId: '1',
      userId: '2',
      userEmail: 'nutritionist@huongduong.edu.vn',
      action: 'UPDATE_CHILD_GROWTH',
      targetEntity: 'GROWTH_RECORD',
      targetId: '14',
      ipAddress: '192.168.1.45',
      details: {
        studentName: 'Nguyễn Minh Khang',
        heightCm: 102.5,
        weightKg: 16.2,
        zscoreStatus: 'NORMAL',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    },
  ];

  log(entry: Omit<AuditLogItem, 'id' | 'createdAt'>) {
    const item: AuditLogItem = {
      ...entry,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.logs.unshift(item);
    return item;
  }

  async getAuditLogs(query?: QueryAuditLogsDto) {
    let filtered = [...this.logs];

    if (query?.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
          (l.targetEntity && l.targetEntity.toLowerCase().includes(q)) ||
          JSON.stringify(l.details).toLowerCase().includes(q),
      );
    }

    if (query?.action && query.action !== 'ALL') {
      filtered = filtered.filter((l) => l.action === query.action);
    }

    if (query?.targetEntity && query.targetEntity !== 'ALL') {
      filtered = filtered.filter((l) => l.targetEntity === query.targetEntity);
    }

    if (query?.startDate) {
      filtered = filtered.filter((l) => l.createdAt >= query.startDate!);
    }

    if (query?.endDate) {
      filtered = filtered.filter((l) => l.createdAt <= query.endDate!);
    }

    const total = filtered.length;
    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, query?.limit || 20);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getFilterOptions() {
    return {
      actions: [
        'APPROVE_MENU',
        'CREATE_MENU',
        'PUBLISH_MENU',
        'FOOD_INSPECTION_STEP1',
        'FOOD_INSPECTION_STEP2',
        'FOOD_INSPECTION_STEP3',
        'RETAIN_FOOD_SAMPLE',
        'SUBMIT_PAYMENT',
        'RECORD_ATTENDANCE',
        'UPDATE_CHILD_GROWTH',
        'LOGIN_SUCCESS',
      ],
      targetEntities: [
        'MENU',
        'FOOD_INSPECTION',
        'FOOD_SAMPLE',
        'PAYMENT',
        'ATTENDANCE',
        'GROWTH_RECORD',
        'CHILD',
        'USER',
      ],
    };
  }

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.logs.filter((l) => l.createdAt.startsWith(today)).length;
    return {
      totalLogs: this.logs.length,
      todayLogs: todayLogs || this.logs.length,
    };
  }
}
