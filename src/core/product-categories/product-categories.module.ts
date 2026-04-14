import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategory } from './product-category.entity';
import {
  ProductCategory as MongoProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import { NoSqlRepository } from 'src/lib/no-sql-database/repository';
import { SqlRepository } from 'src/lib/sql-database/repository';
import * as dotenv from 'dotenv';
dotenv.config();

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb'
      ? [TypeOrmModule.forFeature([ProductCategory])]
      : []),
    ...(dbType === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: MongoProductCategory.name, schema: ProductCategorySchema },
          ]),
        ]
      : []),
  ],
  controllers: [ProductCategoriesController],
  providers: [
    ProductCategoriesService,
    {
      provide: 'PRODUCT_CATEGORY_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb'
          ? [getModelToken(MongoProductCategory.name)]
          : [getRepositoryToken(ProductCategory)]),
      ],
      useFactory: (config: ConfigService, engine: any) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [ProductCategoriesService, 'PRODUCT_CATEGORY_REPOSITORY'],
})
export class ProductCategoriesModule {}
