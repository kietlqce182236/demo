import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Headers } from '@nestjs/common';
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

  @Put(':id')
  updatePut(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.update(id, updateClassDto, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.update(id, updateClassDto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.remove(id, tenantId);
  }

  @Get(':id/students')
  getStudents(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.getClassStudents(id, tenantId);
  }

  @Post(':id/students')
  addStudents(
    @Param('id') id: string,
    @Body() body: { childIds: string[] },
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.addStudentsToClass(id, body.childIds, tenantId);
  }

  @Delete(':id/students/:childId')
  removeStudent(
    @Param('id') id: string,
    @Param('childId') childId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.classesService.removeStudentFromClass(id, childId, tenantId);
  }
}
