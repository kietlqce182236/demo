import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Tenant } from '../auth/entities/tenant.entity';
import { Role } from '../auth/entities/role.entity';
import { AuthModule } from '../auth/auth.module';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserProfileService } from './services/user-profile.service';
import { StaffManagementController } from './controllers/staff-management.controller';
import { StaffManagementService } from './services/staff-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Role]),
    AuthModule,
  ],
  controllers: [UserProfileController, StaffManagementController],
  providers: [UserProfileService, StaffManagementService],
  exports: [UserProfileService, StaffManagementService],
})
export class UsersModule {}

