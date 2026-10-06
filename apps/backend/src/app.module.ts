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
import { MenusModule } from './modules/menus/menus.module';
import { ClassesModule } from './modules/classes/classes.module';
import { FoodsModule } from './modules/foods/foods.module';
import { DishesModule } from './modules/dishes/dishes.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { ChildrenModule } from './modules/children/children.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ParentEvaluationsModule } from './modules/parent-evaluations/parent-evaluations.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { FinancesModule } from './modules/finances/finances.module';

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
    MenusModule,
    PaymentsModule,
    GrowthModule,
    WebsocketModule,
    SnackServicesModule,
    ClassesModule,
    FoodsModule,
    DishesModule,
    InspectionsModule,
    ChildrenModule,
    DashboardModule,
    ParentEvaluationsModule,
    AttendanceModule,
    AuditLogsModule,
    FinancesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Áp dụng middleware tự động phân giải tenantId cho toàn bộ các route API
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
