import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealCoordinationNote } from '../entities/meal-coordination-note.entity';
import { MealCoordinationDto } from '../dto/meal-coordination.dto';

@Injectable()
export class MealCoordinationService {
  constructor(
    @InjectRepository(MealCoordinationNote)
    private readonly noteRepo: Repository<MealCoordinationNote>,
  ) {}

  async findAll(date?: string) {
    const qb = this.noteRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.fromUser', 'user');

    if (date) {
      qb.andWhere('n.date = :date', { date });
    }

    qb.orderBy('n.createdAt', 'DESC');
    const items = await qb.getMany();

    return items.map((n) => ({
      id: String(n.id),
      date: n.date,
      fromUserName: n.fromUser?.fullName || 'Người dùng',
      content: n.content,
      createdAt: n.createdAt,
    }));
  }

  async create(dto: MealCoordinationDto, userId: number) {
    const note = this.noteRepo.create({
      date: dto.date,
      content: dto.content,
      fromUserId: userId || 1,
    });
    return this.noteRepo.save(note);
  }
}
