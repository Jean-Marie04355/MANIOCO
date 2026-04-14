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
import { NoSqlRepository } from 'src/lib/no-sql-database/repository';
import { SqlRepository } from 'src/lib/sql-database/repository';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';
import * as dotenv from 'dotenv';
dotenv.config();

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([Product])] : []),
    ...(dbType === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: MongoProduct.name, schema: ProductSchema },
          ]),
        ]
      : []),
    ProductCategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: 'PRODUCT_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb'
          ? [getModelToken(MongoProduct.name)]
          : [getRepositoryToken(Product)]),
      ],
      useFactory: (config: ConfigService, engine: unknown) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [ProductsService, 'PRODUCT_REPOSITORY'],
})
export class ProductsModule {}
