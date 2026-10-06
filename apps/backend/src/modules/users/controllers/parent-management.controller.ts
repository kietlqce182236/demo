import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParentManagementService } from '../services/parent-management.service';
import { CreateParentDto } from '../dto/parent/create-parent.dto';
import { UpdateParentDto } from '../dto/parent/update-parent.dto';
import { QueryParentDto } from '../dto/parent/query-parent.dto';

@Controller('users/parents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentManagementController {
  constructor(private readonly parentService: ParentManagementService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get()
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async getParents(@Req() req: Request, @Query() query: QueryParentDto) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.getParentList(tenantId, query);
  }

  @Get('stats')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async getStats(@Req() req: Request) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.getParentStats(tenantId);
  }

  @Post()
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  @HttpCode(HttpStatus.CREATED)
  async createParent(@Req() req: Request, @Body() dto: CreateParentDto) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.createParent(tenantId, dto);
  }

  @Put(':id')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async updateParent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateParentDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.updateParent(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async deleteParent(@Req() req: Request, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.deleteParent(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async restoreParent(@Req() req: Request, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.parentService.restoreParent(tenantId, id);
  }
}
