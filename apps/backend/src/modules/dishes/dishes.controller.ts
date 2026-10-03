import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DishesService } from './dishes.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { GetDishesQueryDto } from './dto/get-dishes-query.dto';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get('categories')
  async getCategories() {
    return this.dishesService.getCategories();
  }

  @Get('approvals')
  async getApprovals(@Req() req: Request, @Query('status') status?: string) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    return this.dishesService.getApprovalRequests(tenantId, status);
  }

  @Post('approvals/:id/review')
  async reviewApproval(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { approve: boolean; notes?: string },
  ) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    const reviewerId = (req as any).user?.id || '10000000-0000-0000-0000-000000000001';
    return this.dishesService.reviewApproval(tenantId, id, reviewerId, body.approve, body.notes);
  }

  @Post(':id/request-approval')
  async requestApproval(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    const requestedBy = (req as any).user?.id || '10000000-0000-0000-0000-000000000002';
    return this.dishesService.requestApproval(tenantId, id, requestedBy, reason);
  }

  @Post()
  async create(@Req() req: Request, @Body() createDishDto: CreateDishDto) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    try {
      return await this.dishesService.create(tenantId, createDishDto);
    } catch (error) {
      console.error('CREATE DISH ERROR:', error);
      throw new BadRequestException(error.message || 'Failed to create dish');
    }
  }

  @Get()
  async findAll(@Req() req: Request, @Query() query: GetDishesQueryDto) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    try {
      return await this.dishesService.findAll(tenantId, query);
    } catch (error) {
      console.error('ERROR IN DISHES FINDALL:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    return this.dishesService.findOne(id, tenantId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateDishDto: UpdateDishDto) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    return this.dishesService.update(id, tenantId, updateDishDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001';
    return this.dishesService.remove(id, tenantId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/dishes',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận file hình ảnh!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy file');
    }
    return {
      imageUrl: `/uploads/dishes/${file.filename}`,
    };
  }
}
