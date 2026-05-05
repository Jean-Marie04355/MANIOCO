import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategory } from './product-category.entity';
import {
  ProductCategory as MongoProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import { NoSqlRepository } from '../../libs/no-sql-database/repository';
import { SqlRepository } from '../../libs/sql-database/repository';
import { StoreModule } from '../store/store.module';
import { RolesModule } from '../roles/roles.module';
import { CacheModule } from '../../libs/cache/cache.module';
import { RealtimeModule } from '../../libs/realtime/realtime.module';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    RolesModule,
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoProductCategory.name, schema: ProductCategorySchema },
        ])
      : TypeOrmModule.forFeature([ProductCategory]),
    StoreModule,
    CacheModule,
    RealtimeModule,
  ],
  controllers: [ProductCategoriesController],
  providers: [
    ProductCategoriesService,
    {
      provide: 'PRODUCT_CATEGORY_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoProductCategory.name)
          : getRepositoryToken(ProductCategory),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [ProductCategoriesService, 'PRODUCT_CATEGORY_REPOSITORY'],
})
export class ProductCategoriesModule {}
