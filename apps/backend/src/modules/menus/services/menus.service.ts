import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In, ILike } from 'typeorm';
import { Menu } from '../entities/menu.entity';
import { MenuDish } from '../entities/menu-dish.entity';
import { Dish } from '../entities/dish.entity';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { AdjustDishDto } from '../dto/adjust-dish.dto';
import { ApproveMenuDto } from '../dto/approve-menu.dto';
import { RejectMenuDto } from '../dto/reject-menu.dto';
import { ImportExcelMenuDto } from '../dto/import-excel.dto';
import { QueryMenuDto } from '../dto/query-menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,

    @InjectRepository(MenuDish)
    private readonly menuDishRepo: Repository<MenuDish>,

    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
  ) {}

  /**
   * 1. Lấy danh sách thực đơn tuần (có lọc phiên bản, trạng thái, nhóm tuổi, tìm kiếm & xóa mềm)
   */
  async findAll(tenantId: string, query: QueryMenuDto): Promise<Menu[]> {
    const qb = this.menuRepo.createQueryBuilder('menu');

    qb.where('menu.tenant_id = :tenantId', { tenantId });

    if (query.includeDeleted) {
      qb.withDeleted().andWhere('menu.deleted_at IS NOT NULL');
    } else {
      qb.andWhere('menu.deleted_at IS NULL');
    }

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('menu.status = :status', { status: query.status });
    }

    if (query.targetAgeGroup && query.targetAgeGroup !== 'ALL') {
      qb.andWhere('menu.target_age_group = :ageGroup', { ageGroup: query.targetAgeGroup });
    }

    if (query.version) {
      qb.andWhere('menu.version = :version', { version: query.version });
    }

    if (query.search) {
      qb.andWhere('menu.title ILIKE :search', { search: `%${query.search.trim()}%` });
    }

    qb.orderBy('menu.startDate', 'DESC')
      .addOrderBy('menu.version', 'DESC')
      .addOrderBy('menu.createdAt', 'DESC');

    return qb.getMany();
  }

  /**
   * 2. Thống kê KPI ở đầu giao diện
   */
  async getStatistics(tenantId: string) {
    const menus = await this.menuRepo.find({
      where: { tenantId, deletedAt: IsNull() },
    });

    const total = menus.length;
    const active = menus.filter((m) => m.status === 'ACTIVE').length;
    const submitted = menus.filter((m) => m.status === 'SUBMITTED_FOR_REVIEW').length;
    const draft = menus.filter((m) => m.status === 'DRAFT').length;
    const rejected = menus.filter((m) => m.status === 'REJECTED').length;
    const approved = menus.filter((m) => m.status === 'APPROVED').length;

    // Tính calo trung bình ngày của các thực đơn đang áp dụng hoặc thực đơn gần nhất
    const caloriesList = menus
      .map((m) => Number(m.dailyAverageCalories))
      .filter((cal) => cal > 0);
    const avgCalories =
      caloriesList.length > 0
        ? Math.round(caloriesList.reduce((a, b) => a + b, 0) / caloriesList.length)
        : 780; // Mặc định 780 Kcal chuẩn mẫu giáo

    return {
      total,
      active,
      submitted,
      draft,
      rejected,
      approved,
      avgCalories,
      nutritionStandard: 'Thông tư 28/2016/TT-BGDĐT & VN-RDA 2024',
    };
  }

  /**
   * 3. Chi tiết thực đơn tuần kèm ma trận món ăn
   */
  async findOne(tenantId: string, id: string): Promise<Menu> {
    const menu = await this.menuRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
      relations: ['menuDishes', 'menuDishes.dish', 'menuDishes.substituteDish'],
    });

    if (!menu) {
      throw new NotFoundException(`Không tìm thấy thực đơn tuần với ID: ${id}`);
    }

    // Lọc bỏ món đã xóa mềm nếu có
    if (menu.menuDishes) {
      menu.menuDishes = menu.menuDishes.filter((md) => !md.deletedAt);
      menu.menuDishes.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.servingOrder - b.servingOrder;
      });
    }

    return menu;
  }

  /**
   * 4. Lấy lịch sử tất cả phiên bản của thực đơn
   */
  async getVersions(tenantId: string, id: string): Promise<Menu[]> {
    const current = await this.menuRepo.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!current) {
      throw new NotFoundException(`Không tìm thấy thực đơn với ID: ${id}`);
    }

    // Tìm menu gốc
    const rootId = current.parentMenuId || current.id;

    // Tìm tất cả menu có id = rootId hoặc parentMenuId = rootId
    const versions = await this.menuRepo.find({
      where: [
        { id: rootId, tenantId },
        { parentMenuId: rootId, tenantId },
      ],
      order: { version: 'DESC', createdAt: 'DESC' },
    });

    return versions;
  }

  /**
   * 5. Tạo thực đơn tuần thủ công
   */
  async create(tenantId: string, userId: string, dto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepo.create({
      tenantId,
      createdBy: userId,
      title: dto.title,
      menuCycleType: dto.menuCycleType || 'WEEKLY',
      targetAgeGroup: dto.targetAgeGroup || 'ALL_AGES',
      startDate: dto.startDate,
      endDate: dto.endDate,
      cycleWeekNumber: dto.cycleWeekNumber || 1,
      status: 'DRAFT',
      version: 1,
      parentMenuId: dto.parentMenuId || null,
      isPublished: false,
    });

    const savedMenu = await this.menuRepo.save(menu);

    // Nếu có món ăn gửi kèm
    if (dto.dishes && dto.dishes.length > 0) {
      for (const item of dto.dishes) {
        const dish = await this.dishRepo.findOne({ where: { id: item.dishId } });
        const portion = item.portionSizeG || (dish ? Number(dish.standardServingSizeG) : 100);
        const ratio = dish && Number(dish.standardServingSizeG) > 0 ? portion / Number(dish.standardServingSizeG) : 1;
        const cal = dish ? Math.round(Number(dish.totalCalories) * ratio) : 0;

        const menuDish = this.menuDishRepo.create({
          tenantId,
          menuId: savedMenu.id,
          dishId: item.dishId,
          dayOfWeek: item.dayOfWeek,
          mealTime: item.mealTime,
          portionSizeG: portion,
          plannedCalories: cal,
          substituteDishId: item.substituteDishId || null,
          specialDietNotes: item.specialDietNotes || null,
        });

        await this.menuDishRepo.save(menuDish);
      }
    }

    await this.recalculateNutrition(savedMenu.id);
    return this.findOne(tenantId, savedMenu.id);
  }

  /**
   * 6. Tạo phiên bản mới (v1.1, v2.0...) từ phiên bản hiện tại
   */
  async createVersion(tenantId: string, userId: string, id: string): Promise<Menu> {
    const sourceMenu = await this.findOne(tenantId, id);

    // Tìm version cao nhất hiện tại của cụm này
    const allVersions = await this.getVersions(tenantId, id);
    const maxVersion = Math.max(...allVersions.map((v) => v.version), sourceMenu.version);
    const newVersionNumber = maxVersion + 1;

    const rootParentId = sourceMenu.parentMenuId || sourceMenu.id;

    // Tạo bản clone
    const newMenu = this.menuRepo.create({
      tenantId,
      createdBy: userId,
      title: `${sourceMenu.title.replace(/\s*\(Bản v\d+\)$/, '')} (Bản v${newVersionNumber}.0)`,
      menuCycleType: sourceMenu.menuCycleType,
      targetAgeGroup: sourceMenu.targetAgeGroup,
      startDate: sourceMenu.startDate,
      endDate: sourceMenu.endDate,
      cycleWeekNumber: sourceMenu.cycleWeekNumber,
      status: 'DRAFT',
      version: newVersionNumber,
      parentMenuId: rootParentId,
      dailyAverageCalories: sourceMenu.dailyAverageCalories,
      dailyAverageProteinG: sourceMenu.dailyAverageProteinG,
      dailyAverageFatG: sourceMenu.dailyAverageFatG,
      dailyAverageCarbG: sourceMenu.dailyAverageCarbG,
      isPublished: false,
    });

    const savedNewMenu = await this.menuRepo.save(newMenu);

    // Sao chép toàn bộ món ăn sang phiên bản mới
    if (sourceMenu.menuDishes && sourceMenu.menuDishes.length > 0) {
      const clonedDishes = sourceMenu.menuDishes.map((md) => {
        return this.menuDishRepo.create({
          tenantId,
          menuId: savedNewMenu.id,
          dishId: md.dishId,
          dayOfWeek: md.dayOfWeek,
          mealTime: md.mealTime,
          servingOrder: md.servingOrder,
          portionSizeG: md.portionSizeG,
          plannedCalories: md.plannedCalories,
          substituteDishId: md.substituteDishId,
          specialDietNotes: md.specialDietNotes,
        });
      });

      await this.menuDishRepo.save(clonedDishes);
    }

    return this.findOne(tenantId, savedNewMenu.id);
  }

  /**
   * 7. Cập nhật thông tin thực đơn dự thảo
   */
  async update(tenantId: string, id: string, dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(tenantId, id);

    if (menu.isPublished || menu.status === 'ACTIVE') {
      throw new BadRequestException('Thực đơn đã công bố và khóa, vui lòng tạo phiên bản mới để điều chỉnh.');
    }

    if (dto.title) menu.title = dto.title;
    if (dto.targetAgeGroup) menu.targetAgeGroup = dto.targetAgeGroup;
    if (dto.startDate) menu.startDate = dto.startDate;
    if (dto.endDate) menu.endDate = dto.endDate;
    if (dto.cycleWeekNumber) menu.cycleWeekNumber = dto.cycleWeekNumber;

    await this.menuRepo.save(menu);
    return this.findOne(tenantId, id);
  }

  /**
   * 8. Tinh chỉnh món ăn trong thực đơn dự thảo (thêm, đổi món, đổi định lượng, thêm món thay thế)
   */
  async adjustDish(tenantId: string, menuId: string, dto: AdjustDishDto): Promise<MenuDish> {
    const menu = await this.findOne(tenantId, menuId);

    if (menu.isPublished || menu.status === 'ACTIVE') {
      throw new BadRequestException('Thực đơn đã công bố và khóa, không thể chỉnh sửa món.');
    }

    const dish = await this.dishRepo.findOne({ where: { id: dto.dishId } });
    if (!dish) {
      throw new NotFoundException(`Không tìm thấy món ăn với ID: ${dto.dishId}`);
    }

    const portion = dto.portionSizeG || Number(dish.standardServingSizeG) || 100;
    const ratio = Number(dish.standardServingSizeG) > 0 ? portion / Number(dish.standardServingSizeG) : 1;
    const plannedCal = Math.round(Number(dish.totalCalories) * ratio);

    // Kiểm tra xem đã có món này trong ô này chưa
    let menuDish = await this.menuDishRepo.findOne({
      where: {
        tenantId,
        menuId,
        dayOfWeek: dto.dayOfWeek,
        mealTime: dto.mealTime,
        dishId: dto.dishId,
        deletedAt: IsNull(),
      },
    });

    if (menuDish) {
      // Cập nhật
      menuDish.portionSizeG = portion;
      menuDish.plannedCalories = plannedCal;
      menuDish.substituteDishId = dto.substituteDishId || null;
      menuDish.specialDietNotes = dto.specialDietNotes || null;
    } else {
      // Tạo mới
      menuDish = this.menuDishRepo.create({
        tenantId,
        menuId,
        dishId: dto.dishId,
        dayOfWeek: dto.dayOfWeek,
        mealTime: dto.mealTime,
        portionSizeG: portion,
        plannedCalories: plannedCal,
        substituteDishId: dto.substituteDishId || null,
        specialDietNotes: dto.specialDietNotes || null,
      });
    }

    const savedDish = await this.menuDishRepo.save(menuDish);
    await this.recalculateNutrition(menuId);

    return this.menuDishRepo.findOne({
      where: { id: savedDish.id },
      relations: ['dish', 'substituteDish'],
    }) as Promise<MenuDish>;
  }

  /**
   * 9. Xóa món ăn khỏi bữa ăn (Xóa mềm)
   */
  async removeDish(tenantId: string, menuId: string, menuDishId: string): Promise<boolean> {
    const menu = await this.findOne(tenantId, menuId);
    if (menu.isPublished || menu.status === 'ACTIVE') {
      throw new BadRequestException('Thực đơn đã công bố và khóa, không thể xóa món.');
    }

    const menuDish = await this.menuDishRepo.findOne({
      where: { id: menuDishId, menuId, tenantId, deletedAt: IsNull() },
    });

    if (!menuDish) {
      throw new NotFoundException(`Không tìm thấy món ăn trong thực đơn với ID: ${menuDishId}`);
    }

    // Xóa mềm: đánh dấu deleted_at
    menuDish.deletedAt = new Date();
    await this.menuDishRepo.save(menuDish);

    await this.recalculateNutrition(menuId);
    return true;
  }

  /**
   * 10. Import thực đơn tuần từ file Excel / dữ liệu bảng
   */
  async importExcel(tenantId: string, userId: string, dto: ImportExcelMenuDto): Promise<Menu> {
    // Tạo menu mới
    const menu = this.menuRepo.create({
      tenantId,
      createdBy: userId,
      title: dto.title,
      menuCycleType: 'WEEKLY',
      targetAgeGroup: dto.targetAgeGroup || 'ALL_AGES',
      startDate: dto.startDate,
      endDate: dto.endDate,
      cycleWeekNumber: dto.cycleWeekNumber || 1,
      status: 'DRAFT',
      version: 1,
      isPublished: false,
    });

    const savedMenu = await this.menuRepo.save(menu);

    for (const item of dto.items) {
      if (!item.dishName || !item.dishName.trim()) continue;

      // Tìm món theo tên
      let dish = await this.dishRepo.findOne({
        where: {
          tenantId,
          name: ILike(item.dishName.trim()),
        },
      });

      // Nếu chưa có, tự tạo món ăn mới
      if (!dish) {
        dish = this.dishRepo.create({
          tenantId,
          name: item.dishName.trim(),
          dishType: item.dishType || 'MAIN_COURSE',
          targetAgeGroup: dto.targetAgeGroup || 'ALL_AGES',
          standardServingSizeG: item.portionSizeG || 100,
          totalCalories: item.calories || 120,
          totalProteinG: 6.5,
          totalFatG: 3.5,
          totalCarbG: 15,
          isActive: true,
        });
        dish = await this.dishRepo.save(dish);
      }

      const portion = item.portionSizeG || Number(dish.standardServingSizeG) || 100;
      const ratio = Number(dish.standardServingSizeG) > 0 ? portion / Number(dish.standardServingSizeG) : 1;
      const cal = Math.round(Number(dish.totalCalories) * ratio);

      const menuDish = this.menuDishRepo.create({
        tenantId,
        menuId: savedMenu.id,
        dishId: dish.id,
        dayOfWeek: item.dayOfWeek,
        mealTime: item.mealTime,
        portionSizeG: portion,
        plannedCalories: cal,
      });

      await this.menuDishRepo.save(menuDish);
    }

    await this.recalculateNutrition(savedMenu.id);
    return this.findOne(tenantId, savedMenu.id);
  }

  /**
   * 11. Gửi thực đơn dự thảo lên Ban Giám Hiệu phê duyệt
   */
  async submitForReview(tenantId: string, id: string): Promise<Menu> {
    const menu = await this.findOne(tenantId, id);

    if (menu.status !== 'DRAFT' && menu.status !== 'REJECTED') {
      throw new BadRequestException('Chỉ thực đơn ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi phê duyệt.');
    }

    menu.status = 'SUBMITTED_FOR_REVIEW';
    menu.rejectionReason = null;
    await this.menuRepo.save(menu);

    return this.findOne(tenantId, id);
  }

  /**
   * 12. Ban Giám Hiệu Phê duyệt thực đơn tuần
   */
  async approve(tenantId: string, userId: string, id: string, dto: ApproveMenuDto): Promise<Menu> {
    const menu = await this.findOne(tenantId, id);

    if (menu.status !== 'SUBMITTED_FOR_REVIEW') {
      throw new BadRequestException('Thực đơn chưa được gửi để duyệt hoặc đang ở trạng thái khác.');
    }

    menu.status = 'APPROVED';
    menu.approvedBy = userId;
    menu.approvedAt = new Date();
    menu.approvalNotes = dto.approvalNotes || 'Đã kiểm tra dinh dưỡng và phê duyệt áp dụng.';
    menu.rejectionReason = null;

    await this.menuRepo.save(menu);
    return this.findOne(tenantId, id);
  }

  /**
   * 13. Ban Giám Hiệu Từ chối thực đơn tuần kèm lý do
   */
  async reject(tenantId: string, userId: string, id: string, dto: RejectMenuDto): Promise<Menu> {
    const menu = await this.findOne(tenantId, id);

    if (menu.status !== 'SUBMITTED_FOR_REVIEW') {
      throw new BadRequestException('Thực đơn chưa được gửi để duyệt.');
    }

    menu.status = 'REJECTED';
    menu.rejectionReason = dto.rejectionReason;

    await this.menuRepo.save(menu);
    return this.findOne(tenantId, id);
  }

  /**
   * 14. Khóa & Công bố thực đơn tuần ra toàn trường
   */
  async publish(tenantId: string, userId: string, id: string): Promise<Menu> {
    const menu = await this.findOne(tenantId, id);

    if (menu.status !== 'APPROVED') {
      throw new BadRequestException('Chỉ thực đơn đã được BGH phê duyệt mới có thể công bố.');
    }

    // Chuyển các menu cùng nhóm tuổi và khoảng ngày thành ARCHIVED
    await this.menuRepo
      .createQueryBuilder()
      .update(Menu)
      .set({ status: 'ARCHIVED', isPublished: false })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('target_age_group = :age', { age: menu.targetAgeGroup })
      .andWhere('status = :status', { status: 'ACTIVE' })
      .andWhere('id != :id', { id: menu.id })
      .execute();

    menu.status = 'ACTIVE';
    menu.isPublished = true;

    await this.menuRepo.save(menu);
    return this.findOne(tenantId, id);
  }

  /**
   * 15. Xóa mềm thực đơn tuần (Soft Delete)
   */
  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const menu = await this.menuRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!menu) {
      throw new NotFoundException(`Không tìm thấy thực đơn với ID: ${id}`);
    }

    if (menu.status === 'ACTIVE') {
      throw new BadRequestException('Không thể xóa thực đơn đang công bố hoạt động.');
    }

    menu.deletedAt = new Date();
    await this.menuRepo.save(menu);

    return true;
  }

  /**
   * 16. Khôi phục thực đơn đã xóa mềm
   */
  async restore(tenantId: string, id: string): Promise<Menu> {
    const menu = await this.menuRepo.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!menu || !menu.deletedAt) {
      throw new NotFoundException(`Không tìm thấy thực đơn trong thùng rác.`);
    }

    menu.deletedAt = null;
    await this.menuRepo.save(menu);

    return this.findOne(tenantId, id);
  }

  /**
   * 17. Tính toán lại dinh dưỡng trung bình ngày của thực đơn
   */
  private async recalculateNutrition(menuId: string): Promise<void> {
    const dishes = await this.menuDishRepo.find({
      where: { menuId, deletedAt: IsNull() },
      relations: ['dish'],
    });

    if (!dishes || dishes.length === 0) {
      await this.menuRepo.update(menuId, {
        dailyAverageCalories: 0,
        dailyAverageProteinG: 0,
        dailyAverageFatG: 0,
        dailyAverageCarbG: 0,
      });
      return;
    }

    // Gom theo các ngày trong tuần (T2: 1 -> T6: 5)
    const days = new Set(dishes.map((d) => d.dayOfWeek));
    const dayCount = Math.max(days.size, 1);

    let totalCal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarb = 0;

    for (const md of dishes) {
      const dish = md.dish;
      const portion = Number(md.portionSizeG) || 100;
      const standardSize = dish && Number(dish.standardServingSizeG) > 0 ? Number(dish.standardServingSizeG) : 100;
      const ratio = portion / standardSize;

      if (dish) {
        totalCal += Number(dish.totalCalories) * ratio;
        totalProtein += Number(dish.totalProteinG) * ratio;
        totalFat += Number(dish.totalFatG) * ratio;
        totalCarb += Number(dish.totalCarbG) * ratio;
      }
    }

    await this.menuRepo.update(menuId, {
      dailyAverageCalories: Math.round((totalCal / dayCount) * 100) / 100,
      dailyAverageProteinG: Math.round((totalProtein / dayCount) * 100) / 100,
      dailyAverageFatG: Math.round((totalFat / dayCount) * 100) / 100,
      dailyAverageCarbG: Math.round((totalCarb / dayCount) * 100) / 100,
    });
  }

  /**
   * 18. Lấy danh sách toàn bộ món ăn trong kho để chọn khi tinh chỉnh
   */
  async getAvailableDishes(tenantId: string): Promise<Dish[]> {
    return this.dishRepo.find({
      where: [
        { tenantId, isActive: true },
        { tenantId: IsNull(), isActive: true }, // Món hệ thống
      ],
      order: { name: 'ASC' },
    });
  }
}
