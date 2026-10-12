import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './product.entity';
import {
  Product as MongoProduct,
  ProductSchema,
} from './schemas/product.schema';
import { ProductReview } from './product-review.entity';
import {
  ProductReview as MongoProductReview,
  ProductReviewSchema,
} from './schemas/product-review.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';
import { RolesModule } from '../roles/roles.module';
import { StoreModule } from '../store/store.module';
import { CacheModule } from '../../libs/cache/cache.module';
import { RealtimeModule } from '../../libs/realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    RolesModule,
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoProduct.name, schema: ProductSchema },
          { name: MongoProductReview.name, schema: ProductReviewSchema },
        ])
      : TypeOrmModule.forFeature([Product, ProductReview]),
    ProductCategoriesModule,
    StoreModule,
    CacheModule,
    RealtimeModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'PRODUCT_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoProduct.name)
          : getRepositoryToken(Product),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
    {
      provide: 'PRODUCT_REVIEW_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoProductReview.name)
          : getRepositoryToken(ProductReview),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [ProductsService, 'PRODUCT_REPOSITORY', 'PRODUCT_REVIEW_REPOSITORY'],
})
export class ProductsModule {}
