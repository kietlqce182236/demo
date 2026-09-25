import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ParentEvaluationService } from '../modules/parent-evaluations/services/parent-evaluation.service';
import { ParentEvaluationQueryDto } from '../modules/parent-evaluations/dto/parent-evaluation-query.dto';
import { RespondParentEvaluationDto } from '../modules/parent-evaluations/dto/respond-parent-evaluation.dto';

@Controller('parent-evaluations')
export class ParentEvaluationController {
  constructor(private readonly parentEvaluationService: ParentEvaluationService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get()
  async getEvaluations(
    @Req() req: Request,
    @Query() query: ParentEvaluationQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.parentEvaluationService.getEvaluations(tenantId, query);
  }

  @Post(':id/respond')
  async respondToEvaluation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RespondParentEvaluationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.parentEvaluationService.respondToEvaluation(tenantId, id, dto);
  }

  @Put(':id/respond')
  async updateResponse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RespondParentEvaluationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.parentEvaluationService.respondToEvaluation(tenantId, id, dto);
  }

  @Put(':id/draft')
  async toggleDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('isDrafting') isDrafting: boolean,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.parentEvaluationService.toggleDraft(tenantId, id, isDrafting);
  }
}
