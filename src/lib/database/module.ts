import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SqlDatabaseModule } from '../sql-database/module';
import { NoSqlDatabaseModule } from '../no-sql-database/module';
import { NoSqlRepository } from '../no-sql-database/repository';
import { SqlRepository } from '../sql-database/repository';

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
                // Load only the one we need to avoid DataSource errors
                isMongo ? NoSqlDatabaseModule : SqlDatabaseModule,
            ],
            providers: [
                {
                    provide: 'DATABASE_REPOSITORY',
                    inject: [
                        ConfigService,
                        isMongo ? NoSqlRepository : SqlRepository,
                    ],
                    useFactory: (
                        configService: ConfigService,
                        repository: any,
                    ) => {
                        return repository;
                    },
                },
            ],
            exports: [
                'DATABASE_REPOSITORY',
            ],
        };
    }
}
