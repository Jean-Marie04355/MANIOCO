import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { FilesModule } from './core/files/files.module';
// import { AdminSeeder } from './common/seeder/admin.seeder';
import { DatabaseModule } from './lib/database/module';
import { CategoriesModule } from './core/categories/categories.module';
import { ProductsModule } from './core/products/products.module';
import { StoreModule } from './core/store/store.module';
import { OrdersModule } from './core/orders/orders.module';
import { PaymentsModule } from './core/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.register(),
    UsersModule,
    AuthModule,
    FilesModule,
    CategoriesModule,
    ProductsModule,
    StoreModule,
    OrdersModule,
    PaymentsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}