import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheService } from './libs/cache/cache.service';
import { BullMQService } from './libs/queues/bullmq.service';
import { S3StorageService } from './libs/storage/s3-storage.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { InjectConnection as InjectMongoConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection } from 'mongoose';

@ApiTags('Infrastructure')
@Controller('infra')
export class InfraController {
  constructor(
    private readonly cache: CacheService,
    private readonly queues: BullMQService,
    private readonly s3: S3StorageService,
    @Optional() @InjectConnection() private readonly postgres: Connection,
    @Optional() @InjectMongoConnection() private readonly mongo: MongoConnection,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check infrastructure health' })
  async health() {
    const status = {
      redis: 'down',
      postgres: 'down',
      mongodb: 'down',
      s3: 'down',
      timestamp: new Date().toISOString(),
    };

    // Check Redis
    try {
      const pong = await this.cache.ping();
      if (pong === 'PONG') status.redis = 'up';
    } catch {}

    // Check Postgres
    try {
      if (this.postgres) {
        const isConnected = this.postgres.isConnected;
        if (isConnected) status.postgres = 'up';
      } else {
        status.postgres = 'not_configured';
      }
    } catch {}

    // Check MongoDB
    try {
      if (this.mongo) {
        if (this.mongo.readyState === 1) status.mongodb = 'up';
      } else {
        status.mongodb = 'not_configured';
      }
    } catch {}

    // Check S3
    try {
      await this.s3.listAllObjects();
      status.s3 = 'up';
    } catch {}

    const isAllUp = Object.values(status).every((s) => s === 'up' || typeof s !== 'string'); 

    return {
      status: isAllUp ? 'healthy' : 'degraded',
      details: status,
    };
  }

  @Get('queues/stats')
  @ApiOperation({ summary: 'Get BullMQ statistics' })
  async getQueueStats() {
    return this.queues.getAllQueuesStats();
  }
}
