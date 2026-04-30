import 'dotenv/config';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SqlDatabaseModule } from '../sql-database/module';
import { NoSqlDatabaseModule } from '../no-sql-database/module';
import { NoSqlRepository } from '../no-sql-database/repository';
import { SqlRepository } from '../sql-database/repository';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

/**
 * Universally repaired Database Module from dev3 branch.
 */
@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    const isMongo = process.env.DB_TYPE?.toLowerCase() === 'mongodb';

    return {
      module: DatabaseModule,
      imports: [
        // Conditional loading to prevent crashes if a server (Mongo/Postgres) is missing
        isMongo ? NoSqlDatabaseModule : SqlDatabaseModule,
      ],
      providers: [
        {
          provide: 'DATABASE_REPOSITORY',
          inject: [ConfigService, isMongo ? NoSqlRepository : SqlRepository],
          useFactory: (
            configService: ConfigService,
            repository: IBaseRepository<unknown>,
          ) => {
            return repository;
          },
        },
      ],
      exports: ['DATABASE_REPOSITORY'],
    };
  }
}
