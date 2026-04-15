import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqlRepository } from './repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'sqlite');

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST'),
            port: Number.parseInt(config.get<string>('DB_PORT') || '5432'),
            username: config.get<string>('DB_USER'),
            password: config.get<string>('DB_PASS'),
            database: config.get<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        // SQLite fallback
        return {
          type: 'sqlite',
          database: config.get<string>('SQLITE_DB', 'data/database.sqlite'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
  ],
  providers: [SqlRepository],
  exports: [TypeOrmModule, SqlRepository],
})
export class SqlDatabaseModule {}
