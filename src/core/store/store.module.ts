import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { StoreService } from './store.service';
import { StoreController } from './store.controller';

import { Store } from './store.entity';
import {
  Store as MongoStore,
  StoreSchema,
} from './schemas/store.schema';
import { NoSqlRepository } from '../../lib/no-sql-database/repository';
import { SqlRepository } from '../../lib/sql-database/repository';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { UsersModule } from '../users/users.module'; // ← IMPORTANT for USER_REPOSITORY
import { LocationModule } from '../location/location.module';

const dbType = process.env.DB_TYPE?.toLowerCase();

@Module({
  imports: [
    dbType === 'mongodb'
      ? MongooseModule.forFeature([
          { name: MongoStore.name, schema: StoreSchema },
        ])
      : TypeOrmModule.forFeature([Store]),
    UsersModule,
    LocationModule,
  ],
  controllers: [StoreController],
  providers: [
    StoreService,
    {
      provide: 'STORE_REPOSITORY',
      inject: [
        ConfigService,
        dbType === 'mongodb'
          ? getModelToken(MongoStore.name)
          : getRepositoryToken(Store),
      ],
      useFactory: (
        config: ConfigService,
        engine: unknown,
      ): IBaseRepository<Store> => {
        return config.get('DB_TYPE') === 'mongodb'
          ? new NoSqlRepository(engine as never)
          : new SqlRepository(engine as never);
      },
    },
  ],
  exports: [StoreService, 'STORE_REPOSITORY'],
})
export class StoreModule {}
