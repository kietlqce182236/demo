import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Tenant } from '../auth/entities/tenant.entity';
import { Role } from '../auth/entities/role.entity';
import { AuthModule } from '../auth/auth.module';
import { Child } from '../children/entities/child.entity';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserProfileService } from './services/user-profile.service';
import { StaffManagementController } from './controllers/staff-management.controller';
import { StaffManagementService } from './services/staff-management.service';
import { ParentManagementController } from './controllers/parent-management.controller';
import { ParentManagementService } from './services/parent-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Role, Child]),
    AuthModule,
  ],
  controllers: [
    UserProfileController,
    StaffManagementController,
    ParentManagementController,
  ],
  providers: [
    UserProfileService,
    StaffManagementService,
    ParentManagementService,
  ],
  exports: [
    UserProfileService,
    StaffManagementService,
    ParentManagementService,
  ],
})
export class UsersModule {}

