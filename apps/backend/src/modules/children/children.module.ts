import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Child } from './entities/child.entity';
import { ChildAllergy } from './entities/child-allergy.entity';
import { AllergenCatalog } from './entities/allergen-catalog.entity';
import { ChildrenService } from './services/children.service';
import { ChildrenController } from './controllers/children.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Child, ChildAllergy, AllergenCatalog])],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService, TypeOrmModule],
})
export class ChildrenModule {}
