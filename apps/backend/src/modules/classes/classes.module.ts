import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { Child } from '../children/entities/child.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, Child])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, TypeOrmModule],
})
export class ClassesModule {}
