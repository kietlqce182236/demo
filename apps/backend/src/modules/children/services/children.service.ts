import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { Child } from '../entities/child.entity';
import { ChildAllergy } from '../entities/child-allergy.entity';
import { ChildAllergyHistory } from '../entities/child-allergy-history.entity';
import { AllergenCatalog } from '../entities/allergen-catalog.entity';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto/update-child.dto';
import { GetChildrenQueryDto } from '../dto/get-children-query.dto';
import { DeclareAllergyDto } from '../dto/declare-allergy.dto';
import { UpdateAllergyDto } from '../dto/update-allergy.dto';
import { KitchenGateway } from '../../websocket/kitchen.gateway';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(Child)
    private readonly childRepository: Repository<Child>,
    @InjectRepository(ChildAllergy)
    private readonly childAllergyRepository: Repository<ChildAllergy>,
    @InjectRepository(ChildAllergyHistory)
    private readonly childAllergyHistoryRepository: Repository<ChildAllergyHistory>,
    @InjectRepository(AllergenCatalog)
    private readonly allergenCatalogRepository: Repository<AllergenCatalog>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly kitchenGateway?: KitchenGateway,
  ) {}

  async findAll(tenantId: string, query: GetChildrenQueryDto) {
    const { search, classId, status, hasAllergy, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.childRepository
      .createQueryBuilder('child')
      .leftJoinAndSelect('child.class', 'class')
      .leftJoinAndSelect('child.allergies', 'allergies', 'allergies.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('allergies.allergen', 'allergen')
      .where('child.tenantId = :tenantId', { tenantId });

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unaccent(child.fullName) ILIKE unaccent(:search)', { search: `%${search}%` })
            .orWhere('child.studentCode ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (classId) {
      queryBuilder.andWhere('child.classId = :classId', { classId });
    }

    if (query.parentId) {
      queryBuilder.andWhere('child.parentId = :parentId', { parentId: query.parentId });
    }

    if (status) {
      queryBuilder.andWhere('child.status = :status', { status });
    }

    if (hasAllergy === 'true') {
      queryBuilder.andWhere(
        `EXISTS (SELECT 1 FROM child_allergies ca WHERE ca.child_id = child.id AND ca.is_active = true)`,
      );
    } else if (hasAllergy === 'false') {
      queryBuilder.andWhere(
        `NOT EXISTS (SELECT 1 FROM child_allergies ca WHERE ca.child_id = child.id AND ca.is_active = true)`,
      );
    }

    queryBuilder.orderBy('child.firstName', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string) {
    const child = await this.childRepository.findOne({
      where: { id, tenantId },
      relations: ['class', 'allergies', 'allergies.allergen'],
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${id} not found`);
    }

    return child;
  }

  async create(tenantId: string, dto: CreateChildDto) {
    const fullName = `${dto.lastName.trim()} ${dto.firstName.trim()}`;

    // Auto-generate student code if not given
    let studentCode = dto.studentCode;
    if (!studentCode) {
      const year = new Date().getFullYear();
      const count = await this.childRepository.count({ where: { tenantId } });
      studentCode = `HS-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const child = this.childRepository.create({
      ...dto,
      tenantId,
      fullName,
      studentCode,
    });

    return this.childRepository.save(child);
  }

  async importChildren(tenantId: string, items: any[]) {
    const results = {
      importedCount: 0,
      errors: [] as string[],
    };

    const year = new Date().getFullYear();
    let count = await this.childRepository.count({ where: { tenantId } });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.firstName || !item.lastName) {
          results.errors.push(`Dòng ${i + 1}: Thiếu họ hoặc tên học sinh.`);
          continue;
        }

        let studentCode = item.studentCode?.trim();
        if (!studentCode) {
          count++;
          studentCode = `HS-${year}-${String(count).padStart(4, '0')}`;
        } else {
          const exist = await this.childRepository.findOne({
            where: { tenantId, studentCode },
          });
          if (exist) {
            results.errors.push(`Dòng ${i + 1}: Mã học sinh ${studentCode} đã tồn tại.`);
            continue;
          }
        }

        const fullName = `${item.lastName.trim()} ${item.firstName.trim()}`;
        const child = this.childRepository.create({
          tenantId,
          studentCode,
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          fullName,
          dateOfBirth: item.dateOfBirth || '2021-01-01',
          gender: (item.gender || 'MALE').toUpperCase(),
          classId: item.classId || null,
          emergencyContactName: item.emergencyContactName?.trim() || 'Phụ huynh',
          emergencyContactPhone: item.emergencyContactPhone?.trim() || '0900000000',
          medicalNotes: item.medicalNotes || null,
          status: 'ACTIVE',
        });

        await this.childRepository.save(child);
        results.importedCount++;
      } catch (err: any) {
        results.errors.push(`Dòng ${i + 1}: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Đã nhập thành công ${results.importedCount}/${items.length} học sinh.`,
      ...results,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateChildDto) {
    const child = await this.findOne(id, tenantId);

    if (dto.firstName || dto.lastName) {
      const fName = dto.firstName || child.firstName;
      const lName = dto.lastName || child.lastName;
      dto = { ...dto, fullName: `${lName.trim()} ${fName.trim()}` } as any;
    }

    const updated = this.childRepository.merge(child, dto);
    return this.childRepository.save(updated);
  }

  async transferClass(id: string, tenantId: string, newClassId: string) {
    const child = await this.findOne(id, tenantId);
    child.classId = newClassId;
    const saved = await this.childRepository.save(child);

    // After class change, rescan allergy conflicts for that child
    await this.rescanAllergyConflicts(tenantId, child.id);

    return saved;
  }

  async getStats(tenantId: string) {
    const totalChildren = await this.childRepository.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const allergicChildrenCount = await this.childRepository
      .createQueryBuilder('child')
      .where('child.tenantId = :tenantId', { tenantId })
      .andWhere('child.status = :status', { status: 'ACTIVE' })
      .andWhere(
        `EXISTS (SELECT 1 FROM child_allergies ca WHERE ca.child_id = child.id AND ca.is_active = true)`,
      )
      .getCount();

    // Gender breakdown
    const maleCount = await this.childRepository.count({
      where: { tenantId, status: 'ACTIVE', gender: 'MALE' },
    });
    const femaleCount = await this.childRepository.count({
      where: { tenantId, status: 'ACTIVE', gender: 'FEMALE' },
    });

    return {
      totalChildren,
      allergicChildrenCount,
      nonAllergicCount: totalChildren - allergicChildrenCount,
      maleCount,
      femaleCount,
    };
  }

  async getAllergenCatalogs() {
    return this.allergenCatalogRepository.find({
      order: { nameVi: 'ASC' },
    });
  }

  // --- Allergy Declarations & History ---

  async declareAllergy(tenantId: string, childId: string, dto: DeclareAllergyDto, userId?: string) {
    const child = await this.findOne(childId, tenantId);

    const allergy = this.childAllergyRepository.create({
      ...dto,
      tenantId,
      childId,
      isActive: true,
    });

    const savedAllergy = await this.childAllergyRepository.save(allergy);

    // Save history
    await this.childAllergyHistoryRepository.save({
      tenantId,
      childId,
      childAllergyId: savedAllergy.id,
      changeType: 'CREATED',
      newData: savedAllergy,
      changedBy: userId || null,
    });

    // Auto-rescan active menus for conflicts
    await this.rescanAllergyConflicts(tenantId, childId);

    return this.findOne(childId, tenantId);
  }

  async updateAllergy(tenantId: string, allergyId: string, dto: UpdateAllergyDto, userId?: string) {
    const allergy = await this.childAllergyRepository.findOne({
      where: { id: allergyId, tenantId },
    });

    if (!allergy) {
      throw new NotFoundException(`Allergy record ${allergyId} not found`);
    }

    const oldData = { ...allergy };
    const updated = this.childAllergyRepository.merge(allergy, dto);
    const saved = await this.childAllergyRepository.save(updated);

    // Save history
    await this.childAllergyHistoryRepository.save({
      tenantId,
      childId: saved.childId,
      childAllergyId: saved.id,
      changeType: 'UPDATED',
      oldData,
      newData: saved,
      changedBy: userId || null,
    });

    // Auto-rescan active menus
    await this.rescanAllergyConflicts(tenantId, saved.childId);

    return saved;
  }

  async deactivateAllergy(tenantId: string, allergyId: string, userId?: string) {
    const allergy = await this.childAllergyRepository.findOne({
      where: { id: allergyId, tenantId },
    });

    if (!allergy) {
      throw new NotFoundException(`Allergy record ${allergyId} not found`);
    }

    const oldData = { ...allergy };
    allergy.isActive = false;
    const saved = await this.childAllergyRepository.save(allergy);

    // Save history
    await this.childAllergyHistoryRepository.save({
      tenantId,
      childId: saved.childId,
      childAllergyId: saved.id,
      changeType: 'DEACTIVATED',
      oldData,
      newData: saved,
      changedBy: userId || null,
    });

    // Auto-rescan
    await this.rescanAllergyConflicts(tenantId, saved.childId);

    return { success: true, message: 'Đã hủy kích hoạt hồ sơ dị ứng' };
  }

  async getAllergyHistory(tenantId: string, childId: string) {
    return this.childAllergyHistoryRepository.find({
      where: { tenantId, childId },
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Rescans active menus for allergy conflicts via stored procedure `detect_menu_allergy_conflicts`.
   * Logs new violations to `rule_violations_log` and emits WebSocket alert.
   */
  async rescanAllergyConflicts(tenantId: string, targetChildId?: string) {
    try {
      // Find active or approved menus for this tenant
      const activeMenus = await this.dataSource.query(
        `SELECT id, title FROM menus WHERE tenant_id = $1 AND status IN ('APPROVED', 'ACTIVE') AND deleted_at IS NULL`,
        [tenantId],
      );

      for (const menu of activeMenus) {
        const conflicts = await this.dataSource.query(
          `SELECT * FROM detect_menu_allergy_conflicts($1)`,
          [menu.id],
        );

        for (const conf of conflicts) {
          if (targetChildId && conf.child_id !== targetChildId) continue;

          // Check if already logged
          const existing = await this.dataSource.query(
            `SELECT id FROM rule_violations_log WHERE tenant_id = $1 AND menu_id = $2 AND dish_id = $3 AND child_id = $4 AND violation_code = 'ALLERGEN_CONFLICT'`,
            [tenantId, menu.id, conf.dish_id, conf.child_id],
          );

          if (existing.length === 0) {
            const message = `Cảnh báo dị ứng: Món "${conf.dish_name}" chứa dị nguyên "${conf.allergen_detected}" xung đột với Bé ${conf.child_name} (${conf.class_name})`;

            await this.dataSource.query(
              `INSERT INTO rule_violations_log (tenant_id, menu_id, dish_id, child_id, violation_code, severity, meal_type, message, status)
               VALUES ($1, $2, $3, $4, 'ALLERGEN_CONFLICT', 'CRITICAL', 'LUNCH', $5, 'OPEN')`,
              [tenantId, menu.id, conf.dish_id, conf.child_id, message],
            );

            // Notify kitchen & staff via WebSocket
            if (this.kitchenGateway) {
              this.kitchenGateway.notifyAllergyAlert(tenantId, {
                childId: conf.child_id,
                childName: conf.child_name,
                className: conf.class_name,
                allergen: conf.allergen_detected,
                severity: conf.severity || 'CRITICAL',
                replacementMeal: 'Cần đổi suất ăn riêng',
                priority: 'HIGH',
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during allergy rescan:', err.message);
    }
  }

  async findByParent(tenantId: string, parentId: string) {
    return this.childRepository.find({
      where: { tenantId, parentId },
      relations: ['class', 'allergies', 'allergies.allergen'],
      order: { firstName: 'ASC' },
    });
  }

  async linkParent(tenantId: string, childId: string, parentId: string) {
    const child = await this.findOne(childId, tenantId);
    child.parentId = parentId;
    return this.childRepository.save(child);
  }
}
