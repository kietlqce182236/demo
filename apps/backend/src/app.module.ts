import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';

import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ChildrenModule } from './modules/children/children.module';
import { UsersModule } from './modules/users/users.module';
import { FoodsModule } from './modules/foods/foods.module';
import { DishesModule } from './modules/dishes/dishes.module';
import { NutritionEngineModule } from './modules/nutrition-engine/nutrition-engine.module';
import { MenusModule } from './modules/menus/menus.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { MealPortionsModule } from './modules/meal-portions/meal-portions.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SnackServicesModule } from './modules/snack-services/snack-services.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GrowthModule } from './modules/growth/growth.module';
import { ParentEvaluationsModule } from './modules/parent-evaluations/parent-evaluations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinancesModule } from './modules/finances/finances.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    TenantModule,
    ClassesModule,
    ChildrenModule,
    UsersModule,
    FoodsModule,
    DishesModule,
    NutritionEngineModule,
    MenusModule,
    AttendanceModule,
    MealPortionsModule,
    InspectionsModule,
    WebsocketModule,
    SnackServicesModule,
    PaymentsModule,
    GrowthModule,
    ParentEvaluationsModule,
    DashboardModule,
    FinancesModule,
    AuditLogsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
