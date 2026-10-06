import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async findAll(tenantId: string, query: QueryAuditLogsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepo.createQueryBuilder('log')
      .where('(log.tenantId = :tenantId OR log.tenantId IS NULL)', { tenantId })
      .orderBy('log.createdAt', 'DESC');

    if (query.action && query.action !== 'ALL') {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    if (query.targetEntity && query.targetEntity !== 'ALL') {
      qb.andWhere('log.targetEntity = :targetEntity', { targetEntity: query.targetEntity });
    }

    if (query.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('log.createdAt <= :endDate', { endDate: end });
    }

    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(log.userEmail ILIKE :s OR log.action ILIKE :s OR log.targetEntity ILIKE :s OR log.targetId ILIKE :s OR log.ipAddress ILIKE :s)',
        { s },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFilterOptions(tenantId: string) {
    const actionsRaw = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .where('(log.tenantId = :tenantId OR log.tenantId IS NULL)', { tenantId })
      .getRawMany();

    const entitiesRaw = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.targetEntity', 'targetEntity')
      .where('(log.tenantId = :tenantId OR log.tenantId IS NULL)', { tenantId })
      .andWhere('log.targetEntity IS NOT NULL')
      .getRawMany();

    return {
      actions: actionsRaw.map((r) => r.action).filter(Boolean),
      targetEntities: entitiesRaw.map((r) => r.targetEntity).filter(Boolean),
    };
  }

  async getStats(tenantId: string) {
    const total = await this.auditLogRepo.count({
      where: [{ tenantId }, { tenantId: null as any }],
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await this.auditLogRepo
      .createQueryBuilder('log')
      .where('(log.tenantId = :tenantId OR log.tenantId IS NULL)', { tenantId })
      .andWhere('log.createdAt >= :today', { today: startOfToday })
      .getCount();

    return {
      totalLogs: total,
      todayLogs: todayCount,
    };
  }

  async recordLog(data: {
    tenantId?: string;
    userId: string;
    userEmail?: string;
    action: string;
    targetEntity?: string;
    targetId?: string;
    ipAddress?: string;
    details?: any;
  }) {
    const log = this.auditLogRepo.create({
      tenantId: data.tenantId,
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      targetEntity: data.targetEntity,
      targetId: data.targetId,
      ipAddress: data.ipAddress || '127.0.0.1',
      details: data.details,
    });
    return this.auditLogRepo.save(log);
  }
}
