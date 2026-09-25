import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
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

  /**
   * Lấy danh mục các chất gây dị ứng (Master toàn quốc + Tùy chỉnh của trường)
   */
  async getAllergens(
    tenantId: string,
    options?: {
      search?: string;
      includeDeleted?: boolean;
    },
  ) {
    const qb = this.allergenRepo
      .createQueryBuilder('a')
      .where('(a.tenantId = :tenantId OR a.tenantId IS NULL)', { tenantId });

    if (options?.includeDeleted) {
      qb.withDeleted();
    }

    if (options?.search && options.search.trim() !== '') {
      const search = `%${options.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(a.code) LIKE :search OR LOWER(a.nameVi) LIKE :search OR LOWER(a.commonFoods) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('a.tenantId', 'DESC') // Tùy biến của trường lên trước
      .addOrderBy('a.code', 'ASC');

    const list = await qb.getMany();

    return list.map((item) => ({
      ...item,
      isSystemStandard: item.tenantId === null,
      isDeleted: item.deletedAt !== null,
    }));
  }

  /**
   * Lấy chi tiết 1 chất dị ứng
   */
  async getAllergenById(id: string, tenantId: string) {
    const allergen = await this.allergenRepo
      .createQueryBuilder('a')
      .withDeleted()
      .where('a.id = :id AND (a.tenantId = :tenantId OR a.tenantId IS NULL)', { id, tenantId })
      .getOne();

    if (!allergen) {
      throw new NotFoundException('Không tìm thấy thông tin chất gây dị ứng này.');
    }

    return {
      ...allergen,
      isSystemStandard: allergen.tenantId === null,
      isDeleted: allergen.deletedAt !== null,
    };
  }

  /**
   * Thêm chất dị ứng mới vào danh mục
   */
  async createAllergen(tenantId: string, dto: CreateAllergenDto) {
    const code = dto.code.trim().toUpperCase();

    // Kiểm tra trùng mã
    const existing = await this.allergenRepo
      .createQueryBuilder('a')
      .withDeleted()
      .where('a.code = :code AND (a.tenantId = :tenantId OR a.tenantId IS NULL)', { code, tenantId })
      .getOne();

    if (existing) {
      throw new ConflictException(`Mã chất dị ứng "${code}" đã tồn tại trong danh mục.`);
    }

    const newAllergen = this.allergenRepo.create({
      tenantId,
      code,
      nameVi: dto.nameVi.trim(),
      nameEn: dto.nameEn ? dto.nameEn.trim() : null,
      commonFoods: dto.commonFoods ? dto.commonFoods.trim() : null,
      description: dto.description ? dto.description.trim() : null,
      isActive: true,
    });

    const saved = await this.allergenRepo.save(newAllergen);
    return {
      ...saved,
      isSystemStandard: false,
      isDeleted: false,
    };
  }

  /**
   * Cập nhật chất dị ứng
   */
  async updateAllergen(id: string, tenantId: string, dto: UpdateAllergenDto) {
    const allergen = await this.allergenRepo.findOne({ where: { id } });

    if (!allergen) {
      throw new NotFoundException('Không tìm thấy chất dị ứng cần cập nhật.');
    }

    if (allergen.tenantId === null) {
      throw new ForbiddenException(
        'Đây là danh mục dị ứng chuẩn quốc tế Codex/BYT, không thể sửa đổi trực tiếp.',
      );
    }

    if (allergen.tenantId !== tenantId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa dữ liệu của trường khác.');
    }

    Object.assign(allergen, {
      ...dto,
      nameVi: dto.nameVi ? dto.nameVi.trim() : allergen.nameVi,
    });

    const updated = await this.allergenRepo.save(allergen);
    return {
      ...updated,
      isSystemStandard: false,
      isDeleted: false,
    };
  }

  /**
   * Xóa mềm (Soft Delete) chất dị ứng
   */
  async softDeleteAllergen(id: string, tenantId: string) {
    const allergen = await this.allergenRepo.findOne({ where: { id } });

    if (!allergen) {
      throw new NotFoundException('Không tìm thấy chất dị ứng này.');
    }

    if (allergen.tenantId === null) {
      throw new ForbiddenException('Không thể xóa chất dị ứng chuẩn quốc gia.');
    }

    if (allergen.tenantId !== tenantId) {
      throw new ForbiddenException('Bạn không có quyền xóa dữ liệu của trường khác.');
    }

    await this.allergenRepo.softDelete({ id, tenantId });
    await this.allergenRepo.update({ id, tenantId }, { isActive: false });

    return {
      success: true,
      message: `Đã chuyển chất dị ứng "${allergen.nameVi}" vào danh mục lưu trữ (xóa mềm).`,
    };
  }

  /**
   * Khôi phục (Restore) chất dị ứng
   */
  async restoreAllergen(id: string, tenantId: string) {
    const allergen = await this.allergenRepo
      .createQueryBuilder('a')
      .withDeleted()
      .where('a.id = :id AND a.tenantId = :tenantId', { id, tenantId })
      .getOne();

    if (!allergen) {
      throw new NotFoundException('Không tìm thấy chất dị ứng trong danh mục lưu trữ.');
    }

    await this.allergenRepo.restore({ id, tenantId });
    await this.allergenRepo.update({ id, tenantId }, { isActive: true });

    return {
      success: true,
      message: `Đã khôi phục chất dị ứng "${allergen.nameVi}" thành công.`,
    };
  }
}
