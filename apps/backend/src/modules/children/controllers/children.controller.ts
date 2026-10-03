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
} from '@nestjs/common';
import { Request } from 'express';
import { ChildrenService } from '../services/children.service';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto/update-child.dto';
import { GetChildrenQueryDto } from '../dto/get-children-query.dto';
import { DeclareAllergyDto } from '../dto/declare-allergy.dto';
import { UpdateAllergyDto } from '../dto/update-allergy.dto';

@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  private getTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  private getUserId(req: Request): string | undefined {
    return (req as any).user?.id;
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    return this.childrenService.getStats(this.getTenantId(req));
  }

  @Get('allergen-catalogs')
  async getAllergenCatalogs() {
    return this.childrenService.getAllergenCatalogs();
  }

  @Post('rescan-allergies')
  async rescanAllergies(@Req() req: Request) {
    await this.childrenService.rescanAllergyConflicts(this.getTenantId(req));
    return { success: true, message: 'Đã quét lại xung đột thực đơn dị ứng' };
  }

  @Get()
  async getChildren(@Req() req: Request, @Query() query: GetChildrenQueryDto) {
    return this.childrenService.findAll(this.getTenantId(req), query);
  }

  @Get('my-children')
  async getMyChildren(@Req() req: Request) {
    const userId = this.getUserId(req);
    if (!userId) {
      return [];
    }
    return this.childrenService.findByParent(this.getTenantId(req), userId);
  }

  @Get(':id')
  async getChild(@Req() req: Request, @Param('id') id: string) {
    return this.childrenService.findOne(id, this.getTenantId(req));
  }

  @Post(':id/link-parent')
  async linkParent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('parentId') parentId: string,
  ) {
    return this.childrenService.linkParent(this.getTenantId(req), id, parentId);
  }

  @Post()
  async createChild(@Req() req: Request, @Body() dto: CreateChildDto) {
    return this.childrenService.create(this.getTenantId(req), dto);
  }

  @Put(':id')
  async updateChild(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.update(id, this.getTenantId(req), dto);
  }

  @Post(':id/transfer-class')
  async transferClass(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('classId') classId: string,
  ) {
    return this.childrenService.transferClass(id, this.getTenantId(req), classId);
  }

  @Post(':id/allergies')
  async declareAllergy(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: DeclareAllergyDto,
  ) {
    return this.childrenService.declareAllergy(
      this.getTenantId(req),
      id,
      dto,
      this.getUserId(req),
    );
  }

  @Put('allergies/:allergyId')
  async updateAllergy(
    @Req() req: Request,
    @Param('allergyId') allergyId: string,
    @Body() dto: UpdateAllergyDto,
  ) {
    return this.childrenService.updateAllergy(
      this.getTenantId(req),
      allergyId,
      dto,
      this.getUserId(req),
    );
  }

  @Delete('allergies/:allergyId')
  async deactivateAllergy(
    @Req() req: Request,
    @Param('allergyId') allergyId: string,
  ) {
    return this.childrenService.deactivateAllergy(
      this.getTenantId(req),
      allergyId,
      this.getUserId(req),
    );
  }

  @Get(':id/allergy-history')
  async getAllergyHistory(@Req() req: Request, @Param('id') id: string) {
    return this.childrenService.getAllergyHistory(this.getTenantId(req), id);
  }
}
