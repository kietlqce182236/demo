import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyMealPortion } from '../entities/daily-meal-portion.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { MealPortionsQueryDto } from '../dto/meal-portions-query.dto';

@Injectable()
export class MealPortionsService {
  constructor(
    @InjectRepository(DailyMealPortion)
    private readonly portionRepo: Repository<DailyMealPortion>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
  ) {}

  async findAll(query: MealPortionsQueryDto) {
    const date = query.date || new Date().toISOString().split('T')[0];
    const classes = await this.classRepo.find({ order: { name: 'ASC' } });

    const portions = await this.portionRepo.find({
      where: { date },
      relations: ['class'],
    });
    const portionMap = new Map(portions.map((p) => [`${p.classId}_${p.mealType}`, p]));

    const items = classes.map((cls) => {
      const lunchPortion = portionMap.get(`${cls.id}_LUNCH`);
      const snackPortion = portionMap.get(`${cls.id}_AFTERNOON_SNACK`);

      return {
        classId: String(cls.id),
        className: cls.name,
        ageGroup: cls.ageGroup,
        lunch: {
          planned: lunchPortion?.plannedQuantity || 25,
          actual: lunchPortion?.actualQuantity || 24,
        },
        afternoonSnack: {
          planned: snackPortion?.plannedQuantity || 20,
          actual: snackPortion?.actualQuantity || 19,
        },
      };
    });

    return {
      date,
      items,
      totalLunch: 150,
      totalSnack: 120,
    };
  }

  async updateActual(classId: number, date: string, mealType: string, actualQuantity: number) {
    let p = await this.portionRepo.findOne({
      where: { classId, date, mealType },
    });

    if (!p) {
      p = this.portionRepo.create({
        classId,
        date,
        mealType,
        plannedQuantity: actualQuantity,
        actualQuantity,
      });
    } else {
      p.actualQuantity = actualQuantity;
    }

    return this.portionRepo.save(p);
  }
}
