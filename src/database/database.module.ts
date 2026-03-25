// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // SQL : Postgres ou SQLite
    ...(process.env.DB_TYPE !== 'mongodb'
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const dbType = config.get<string>('DB_TYPE', 'sqlite');

              if (dbType === 'postgres') {
                return {
                  type: 'postgres',
                  host: config.get<string>('DB_HOST'),
                  port: parseInt(config.get<string>('DB_PORT') || '5432'),
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
        ]
      : []),

    // Mongo : seulement si DB_TYPE=mongodb
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              uri: config.get<string>(
                'MONGO_URI',
                'mongodb://localhost:27017/afrigari'
              ),
            }),
          }),
        ]
      : []),
  ],
  exports: [
    ...(process.env.DB_TYPE !== 'mongodb' ? [TypeOrmModule] : []),
    ...(process.env.DB_TYPE === 'mongodb' ? [MongooseModule] : []),
  ],
})
export class DatabaseModule {}