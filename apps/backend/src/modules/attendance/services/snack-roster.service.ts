import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Child } from '../../children/entities/child.entity';
import { SnackRosterQueryDto } from '../dto/snack-roster-query.dto';

@Injectable()
export class SnackRosterService {
  constructor(
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
  ) {}

  async findAll(query: SnackRosterQueryDto) {
    const qb = this.childRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.class', 'cls')
      .leftJoinAndSelect('c.allergies', 'alg')
      .leftJoinAndSelect('alg.allergen', 'ac');

    if (query.classId) {
      qb.andWhere('c.classId = :classId', { classId: query.classId });
    }

    if (query.search) {
      qb.andWhere('(LOWER(c.fullName) LIKE :s OR LOWER(c.studentCode) LIKE :s)', {
        s: `%${query.search.toLowerCase()}%`,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('c.fullName', 'ASC');

    const [children, total] = await qb.getManyAndCount();

    const items = children.map((c, idx) => ({
      id: String(c.id),
      childId: String(c.id),
      childName: c.fullName,
      studentCode: c.studentCode,
      classId: c.classId ? String(c.classId) : '1',
      className: c.class?.name || 'Mầm 1',
      date: query.date || new Date().toISOString().split('T')[0],
      isRegistered: true,
      paymentStatus: 'PAID',
      allergyWarning: (c.allergies || []).length > 0,
      allergens: (c.allergies || []).map((a) => a.allergen?.name || 'Dị ứng'),
      status: 'SERVED',
    }));

    return { items, total, page, limit };
  }
}
