import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { ClassEntity } from './entities/class.entity';
import { UserEntity } from './entities/user.entity';
import { Child } from '../children/entities/child.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, UserEntity, Child])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
