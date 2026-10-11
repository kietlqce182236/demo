import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { StaffProfile } from './entities/staff-profile.entity';
import { ParentProfile } from './entities/parent-profile.entity';
import { UserProfileService } from './services/user-profile.service';
import { StaffManagementService } from './services/staff-management.service';
import { ParentManagementService } from './services/parent-management.service';
import { UserProfileController } from './controllers/user-profile.controller';
import { StaffManagementController } from './controllers/staff-management.controller';
import { ParentManagementController } from './controllers/parent-management.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, StaffProfile, ParentProfile]),
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
    TypeOrmModule,
  ],
})
export class UsersModule {}
