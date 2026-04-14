import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './category.entity';
import { Category as MongoCategory, CategorySchema } from './schemas/category.schema';

import * as dotenv from 'dotenv';
import { NoSqlRepository } from '../../lib/no-sql-database/repository';
import { SqlRepository } from '../../lib/sql-database/repository';
dotenv.config();

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    ...(dbType !== 'mongodb' ? [TypeOrmModule.forFeature([Category])] : []),
    ...(dbType === 'mongodb' ? [MongooseModule.forFeature([{ name: MongoCategory.name, schema: CategorySchema }])] : []),
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: 'CATEGORY_REPOSITORY',
      inject: [
        ConfigService,
        ...(dbType === 'mongodb' ? [getModelToken(MongoCategory.name)] : [getRepositoryToken(Category)]),
      ],
      useFactory: (config: ConfigService, engine: any) => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine)
          : new SqlRepository(engine);
      },
    },
  ],
  exports: [CategoriesService, 'CATEGORY_REPOSITORY'],
})
export class CategoriesModule {}
