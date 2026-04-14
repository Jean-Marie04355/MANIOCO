import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IStorageService',
      useClass: S3StorageService,
    },
    S3StorageService,
  ],
  exports: ['IStorageService', S3StorageService],
})
export class StorageModule {}
