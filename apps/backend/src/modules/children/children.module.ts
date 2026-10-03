import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Child } from './entities/child.entity';
import { ChildAllergy } from './entities/child-allergy.entity';
import { ChildAllergyHistory } from './entities/child-allergy-history.entity';
import { AllergenCatalog } from './entities/allergen-catalog.entity';
import { ChildrenService } from './services/children.service';
import { ChildrenController } from './controllers/children.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Child, ChildAllergy, ChildAllergyHistory, AllergenCatalog]),
    WebsocketModule,
  ],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
