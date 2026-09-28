import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Tenant } from './entities/tenant.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, Role, Tenant]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TwoFactorService, JwtStrategy],
  exports: [AuthService, TwoFactorService, JwtModule, PassportModule],
})
export class AuthModule {}
