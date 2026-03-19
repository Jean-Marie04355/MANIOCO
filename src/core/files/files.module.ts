import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { JsonStorageProvider } from './providers/json-storage.provider';
import { MongoStorageProvider } from './providers/mongo-storage.provider';
import { PostgresStorageProvider } from './providers/postgres-storage.provider';
import { File, FileSchema } from './schemas/file.schema';
import { FileEntity } from './entities/file.entity';

@Module({
  imports: [
    ConfigModule,
    // Note: ensure MongooseModule.forRoot is called in AppModule if using Mongo.
    // For now, these feature modules register the schema/entity for this specific module context.
    ...(process.env.STORAGE_TYPE === 'mongo' ? [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }])] : []),
    ...(process.env.STORAGE_TYPE === 'postgres' ? [TypeOrmModule.forFeature([FileEntity])] : []),
  ],
  controllers: [FilesController],
  providers: [
    JsonStorageProvider,
    ...(process.env.STORAGE_TYPE === 'mongo' 
        ? [MongoStorageProvider] 
        : [{ provide: MongoStorageProvider, useValue: {} }]),
    ...(process.env.STORAGE_TYPE === 'postgres' 
        ? [PostgresStorageProvider] 
        : [{ provide: PostgresStorageProvider, useValue: {} }]),
    {
      provide: 'FILE_STORAGE_PROVIDER',
      inject: [ConfigService, JsonStorageProvider, MongoStorageProvider, PostgresStorageProvider],
      useFactory: (
        configService: ConfigService,
        jsonProvider: JsonStorageProvider,
        mongoProvider: MongoStorageProvider,
        postgresProvider: PostgresStorageProvider,
      ) => {
        const type = configService.get<string>('STORAGE_TYPE', 'json');
        switch (type) {
          case 'mongo':
            return mongoProvider;
          case 'postgres':
            return postgresProvider;
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
