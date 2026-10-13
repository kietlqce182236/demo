import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from '../../../src/modules/audit-logs/services/audit-logs.service';

describe('AuditLogsService (Unit Tests)', () => {
  let service: AuditLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogsService],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log() and getAuditLogs()', () => {
    it('should append log item and query with filters', async () => {
      service.log({
        tenantId: '1',
        userId: '99',
        userEmail: 'manager@huongduong.edu.vn',
        action: 'UPDATE_SCHOOL_INFO',
        targetEntity: 'SCHOOL',
        targetId: '1',
        ipAddress: '127.0.0.1',
        details: { field: 'hotline', value: '02838123456' },
      });

      const res = await service.getAuditLogs({
        action: 'UPDATE_SCHOOL_INFO',
        page: 1,
        limit: 10,
      });

      expect(res.total).toBeGreaterThanOrEqual(1);
      expect(res.items.some((i) => i.action === 'UPDATE_SCHOOL_INFO')).toBe(true);
      expect(res.items[0].userEmail).toBe('manager@huongduong.edu.vn');
    });

    it('should filter logs by search keyword', async () => {
      const res = await service.getAuditLogs({ search: 'RETAIN_FOOD_SAMPLE' });
      expect(res.items.length).toBeGreaterThanOrEqual(1);
      expect(res.items[0].action).toBe('RETAIN_FOOD_SAMPLE');
    });
  });

  describe('getFilterOptions() and getStats()', () => {
    it('should return available actions, entities, and total counts', async () => {
      const options = await service.getFilterOptions();
      expect(options.actions).toContain('APPROVE_MENU');
      expect(options.actions).toContain('FOOD_INSPECTION_STEP1');
      expect(options.targetEntities).toContain('MENU');

      const stats = await service.getStats();
      expect(stats.totalLogs).toBeGreaterThan(0);
    });
  });
});
