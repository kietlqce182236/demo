import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Classes Management')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các lớp học có đếm số trẻ và cảnh báo dị ứng' })
  async findAll(@Query() filter: FilterClassDto) {
    return this.classesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết lớp học và danh sách học sinh' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.findOne(id);
  }

  @Post()
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tạo lớp học mới (BGH)' })
  async create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật thông tin lớp học (BGH)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xóa lớp học (BGH)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.remove(id);
  }

  @Get(':classId/students')
  @ApiOperation({ summary: 'Lấy danh sách học sinh của một lớp' })
  async getStudents(@Param('classId', ParseIntPipe) classId: number) {
    return this.classesService.getStudents(classId);
  }

  @Post(':classId/students')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'TEACHER')
  @ApiOperation({ summary: 'Thêm học sinh vào lớp học' })
  async addStudents(
    @Param('classId', ParseIntPipe) classId: number,
    @Body('childIds') childIds: number[],
  ) {
    return this.classesService.addStudents(classId, childIds);
  }

  @Delete(':classId/students/:childId')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'TEACHER')
  @ApiOperation({ summary: 'Xóa học sinh khỏi lớp học' })
  async removeStudent(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('childId', ParseIntPipe) childId: number,
  ) {
    return this.classesService.removeStudent(classId, childId);
  }
}
