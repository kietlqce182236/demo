import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { SnackRosterService } from '../modules/attendance/services/snack-roster.service';
import { SnackRosterQueryDto } from '../modules/attendance/dto/snack-roster-query.dto';

@Controller('snack-roster')
export class SnackRosterController {
  constructor(private readonly snackRosterService: SnackRosterService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get()
  async getSnackRoster(
    @Req() req: Request,
    @Query() query: SnackRosterQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.snackRosterService.getRosterData(tenantId, query);
  }
}
