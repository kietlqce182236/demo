import { Controller, Get, Post, Body, Patch, Param, Query, Headers } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(
    @Body() createClassDto: CreateClassDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    // Note: For now we use the header to simulate the tenant context
    // In a fully guarded endpoint, you'd extract it from the authenticated user.
    return this.classesService.create(createClassDto, tenantId);
  }

  @Get()
  findAll(
    @Query() filterDto: FilterClassDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.findAll(filterDto, tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.update(id, updateClassDto, tenantId);
  }
}
