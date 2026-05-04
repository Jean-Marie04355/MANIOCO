import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfraController } from './infra.controller';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { FilesModule } from './core/files/files.module';
import { DatabaseModule } from './libs/database/module';
import { ProductCategoriesModule } from './core/product-categories/product-categories.module';
import { ProductsModule } from './core/products/products.module';
import { StoreModule } from './core/store/store.module';
import { StorageModule } from './libs/storage/storage.module';
import { CacheModule } from './libs/cache/cache.module';
import { LocationModule } from './core/location/location.module';
import { OrdersModule } from './core/orders/orders.module';
import { PaymentsModule } from './core/payments/payments.module';
import { RealtimeModule } from './libs/realtime/realtime.module';
import { QueuesModule } from './libs/queues/queues.module';
import { AdminSeeder } from './common/seeder/admin.seeder';
import { RolesModule } from './core/roles/roles.module';
import { PaymentsInfraModule } from './libs/payments/payments-infra.module';
import { AuditModule } from './core/audit/audit.module';
import { ChatModule } from './core/chat/chat.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { SupportModule } from './core/support/support.module';
import { ReportsModule } from './core/reports/reports.module';


import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    DatabaseModule.register(),
    PaymentsInfraModule,
    RolesModule,
    StorageModule,
    CacheModule,
    LocationModule,
    UsersModule,
    AuthModule,
    FilesModule,
    ProductCategoriesModule,
    ProductsModule,
    StoreModule,
    OrdersModule,
    PaymentsModule,
    RealtimeModule,
    QueuesModule,
    AuditModule,
    ChatModule,
    NotificationsModule,
    SupportModule,
    ReportsModule,
  ],

  controllers: [AppController, InfraController],
  providers: [AppService, AdminSeeder],
})
export class AppModule {}
