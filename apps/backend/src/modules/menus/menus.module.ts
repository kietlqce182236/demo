import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuDish } from './entities/menu-dish.entity';
import { Dish } from './entities/dish.entity';
import { MenusService } from './services/menus.service';
import { MenuExportService } from './services/menu-export.service';
import { MenusController } from './controllers/menus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, MenuDish, Dish])],
  controllers: [MenusController],
  providers: [MenusService, MenuExportService],
  exports: [MenusService, MenuExportService],
})
export class MenusModule {}
