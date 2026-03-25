import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Importation des modules MinIO et S3

import { SqlDatabaseModule } from '../sql-database/module';
import { NoSqlDatabaseModule } from '../no-sql-database/module';
import { NoSqlRepository } from '../no-sql-database/repository';
import { SqlRepository } from '../sql-database/repository';

@Module({})
export class DatabaseModule {
    static register(): DynamicModule {
        return {
            module: DatabaseModule,
            imports: [
                SqlDatabaseModule,
                NoSqlDatabaseModule
            ],
            providers: [
                {
                    provide: 'DATABASE_REPOSITORY',
                    inject: [ConfigService,NoSqlRepository,SqlRepository],
                    useFactory: (
                        configService: ConfigService,
                        noSqlRepository: NoSqlRepository<T>,
                        sqlRepository: SqlRepository<T>,
                    ) => {
                        return configService.get<string>('DATABASE_PROVIDER') ===
                            'sql'
                            ? sqlRepository
                            : noSqlRepository;
                    },
                },
               
            ],
            exports: [
                'DATABASE_REPOSITORY',
            ],
        };
    }
}
