import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolTenant } from '../auth/entities/tenant.entity';
import { Language } from './entities/language.entity';
import { UiTranslation } from './entities/ui-translation.entity';
import { SystemConfig } from './entities/system-config.entity';
import { TenantService } from './services/tenant.service';
import { TenantController } from './controllers/tenant.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolTenant, Language, UiTranslation, SystemConfig]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService, TypeOrmModule],
})
export class TenantModule {}
