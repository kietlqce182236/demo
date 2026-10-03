import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { FoodsService } from '../services/foods.service';
import { GetFoodsQueryDto } from '../dto/get-foods-query.dto';
import { CreateFoodDto } from '../dto/create-food.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  async getFoods(@Query() query: GetFoodsQueryDto, @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    return this.foodsService.findAll(tenantId, query);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    return this.foodsService.getStats(tenantId);
  }

  @Get(':id')
  async getFood(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    return this.foodsService.findOne(id, tenantId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/foods',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    // Assuming backend serves static files from public/
    return {
      imageUrl: `/uploads/foods/${file.filename}`,
    };
  }

  @Post('batch-activate-pantry')
  async batchActivatePantry(@Body('foodIds') foodIds: string[], @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    const userId = (req as any).user?.id;
    return this.foodsService.batchActivatePantry(tenantId, foodIds, userId);
  }

  @Post(':id/toggle-pantry')
  async togglePantry(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    const userId = (req as any).user?.id;
    return this.foodsService.togglePantry(tenantId, id, userId);
  }

  @Post()
  async createFood(@Body() createFoodDto: CreateFoodDto, @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    const userId = (req as any).user?.id;
    return this.foodsService.create(tenantId, createFoodDto, userId);
  }

  @Put(':id')
  async updateFood(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto,
    @Req() req: Request
  ) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    return this.foodsService.update(id, tenantId, updateFoodDto);
  }

  @Delete(':id')
  async deleteFood(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000000';
    return this.foodsService.remove(id, tenantId);
  }
}
