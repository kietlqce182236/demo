import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { ClassEntity } from '../../database/entities/class.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, UserEntity])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
