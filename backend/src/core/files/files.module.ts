import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { JsonStorageProvider } from './providers/json-storage.provider';
import { MongoStorageProvider } from './providers/mongo-storage.provider';
import { PostgresStorageProvider } from './providers/postgres-storage.provider';
import { File, FileSchema } from './schemas/file.schema';
import { FileEntity } from './entities/file.entity';
import { S3StorageService } from '../../libs/storage/s3-storage.service';

@Module({
  imports: [
    ConfigModule,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }])]
      : []),
    ...(process.env.DB_TYPE !== 'mongodb' &&
    (process.env.STORAGE_TYPE === 'postgres' ||
      process.env.STORAGE_TYPE === 's3')
      ? [TypeOrmModule.forFeature([FileEntity])]
      : []),
  ],
  controllers: [FilesController],
  providers: [
    S3StorageService,
    JsonStorageProvider,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [MongoStorageProvider]
      : [{ provide: MongoStorageProvider, useValue: {} }]),
    ...(process.env.DB_TYPE !== 'mongodb' && process.env.STORAGE_TYPE === 's3'
      ? [S3StorageProvider]
      : [{ provide: S3StorageProvider, useValue: {} }]),
    ...(process.env.DB_TYPE !== 'mongodb' &&
    (process.env.STORAGE_TYPE === 'postgres' ||
      process.env.STORAGE_TYPE === 's3')
      ? [PostgresStorageProvider]
      : [{ provide: PostgresStorageProvider, useValue: {} }]),
    {
      provide: 'FILE_STORAGE_PROVIDER',
      inject: [
        ConfigService,
        JsonStorageProvider,
        MongoStorageProvider,
        PostgresStorageProvider,
        S3StorageProvider,
      ],
      useFactory: (
        configService: ConfigService,
        jsonProvider: JsonStorageProvider,
        mongoProvider: MongoStorageProvider,
        postgresProvider: PostgresStorageProvider,
        s3Provider: S3StorageProvider,
      ) => {
        const type = configService.get<string>('STORAGE_TYPE', 'json');
        switch (type) {
          case 'mongo':
            return mongoProvider;
          case 'postgres':
            return postgresProvider;
          case 's3':
            return process.env.DB_TYPE === 'mongodb'
              ? mongoProvider
              : s3Provider;
          case 'json':
          default:
            return jsonProvider;
        }
      },
    },
    FilesService,
  ],
  exports: [FilesService],
})
export class FilesModule {}
