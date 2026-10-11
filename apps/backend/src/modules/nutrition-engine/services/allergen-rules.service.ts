import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllergenCatalog } from '../entities/allergen-catalog.entity';
import { CreateAllergenDto } from '../dto/create-allergen.dto';
import { UpdateAllergenDto } from '../dto/update-allergen.dto';

@Injectable()
export class AllergenRulesService {
  constructor(
    @InjectRepository(AllergenCatalog)
    private readonly allergenRepo: Repository<AllergenCatalog>,
  ) {}

  async findAll() {
    const items = await this.allergenRepo.find({ order: { name: 'ASC' } });
    return items.map((a) => ({
      id: String(a.id),
      tenantId: null,
      code: a.code,
      name: a.name,
      nameVi: a.name,
      nameEn: a.code,
      commonFoods: a.description || `Các món ăn chế biến từ hoặc chứa ${a.name}`,
      description: a.description || `Nhóm chất dị ứng theo danh mục chuẩn Codex & Bộ Y Tế: ${a.name}`,
      isActive: true,
      isSystemStandard: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }));
  }

  async findOne(id: number) {
    const item = await this.allergenRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy danh mục dị ứng');
    return {
      id: String(item.id),
      tenantId: null,
      code: item.code,
      name: item.name,
      nameVi: item.name,
      nameEn: item.code,
      commonFoods: item.description || `Các món ăn chế biến từ hoặc chứa ${item.name}`,
      description: item.description || `Nhóm chất dị ứng theo danh mục chuẩn Codex & Bộ Y Tế: ${item.name}`,
      isActive: true,
      isSystemStandard: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
  }

  async create(dto: CreateAllergenDto) {
    const name = dto.name || dto.nameVi || 'Chất dị ứng';
    const description = dto.description || dto.commonFoods || null;
    const allergen = this.allergenRepo.create({
      code: dto.code.toUpperCase(),
      name,
      description,
    });
    const saved = await this.allergenRepo.save(allergen);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAllergenDto) {
    const allergen = await this.allergenRepo.findOne({ where: { id } });
    if (!allergen) throw new NotFoundException('Không tìm thấy danh mục dị ứng');

    if (dto.name || dto.nameVi) allergen.name = (dto.name || dto.nameVi)!;
    if (dto.code) allergen.code = dto.code.toUpperCase();
    if (dto.description !== undefined || dto.commonFoods !== undefined) {
      allergen.description = (dto.description ?? dto.commonFoods)!;
    }

    await this.allergenRepo.save(allergen);
    return this.findOne(id);
  }

  async remove(id: number) {
    const allergen = await this.allergenRepo.findOne({ where: { id } });
    if (!allergen) throw new NotFoundException('Không tìm thấy danh mục dị ứng');
    await this.allergenRepo.remove(allergen);
    return { success: true, message: 'Đã xóa danh mục dị ứng' };
  }
}
