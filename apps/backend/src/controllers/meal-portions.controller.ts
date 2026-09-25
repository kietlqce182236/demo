import { Controller, Get, Post, Param, Query, Req, Res, Header } from '@nestjs/common';
import { Request, Response } from 'express';
import { MealPortionsService } from '../modules/meal-portions/services/meal-portions.service';
import { MealPortionsQueryDto } from '../modules/meal-portions/dto/meal-portions-query.dto';

@Controller('meal-portions')
export class MealPortionsController {
  constructor(private readonly mealPortionsService: MealPortionsService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get()
  async getWeeklyPlan(@Req() req: Request, @Query() query: MealPortionsQueryDto) {
    const tenantId = this.resolveTenantId(req);
    return this.mealPortionsService.getWeeklyPlan(tenantId, query);
  }

  @Post(':id/approve-warehouse-export')
  async approveWarehouseExport(@Req() req: Request, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.mealPortionsService.approveWarehouseExport(tenantId, id);
  }

  @Get(':id/export-excel')
  async exportExcel(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const tenantId = this.resolveTenantId(req);
    const csvContent = await this.mealPortionsService.generateExcelCsv(tenantId, id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="phieu-du-tru-xuat-kho-tuan-14.csv"');
    res.send(csvContent);
  }
}
