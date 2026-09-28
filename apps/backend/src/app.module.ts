import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';

// Core Business Modules
import { AuthModule } from './modules/auth/auth.module';
import { NutritionEngineModule } from './modules/nutrition-engine/nutrition-engine.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GrowthModule } from './modules/growth/growth.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SnackServicesModule } from './modules/snack-services/snack-services.module';

import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TenantModule,
    NutritionEngineModule,
    PaymentsModule,
    GrowthModule,
    WebsocketModule,
    SnackServicesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Áp dụng middleware tự động phân giải tenantId cho toàn bộ các route API
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
