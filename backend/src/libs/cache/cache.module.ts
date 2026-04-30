import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_SERVICE, REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        if (url) {
          return new Redis(url, { maxRetriesPerRequest: null });
        }

        const host = config.get<string>('REDIS_HOST', '127.0.0.1');
        const port = Number(config.get<string | number>('REDIS_PORT', 6379));
        const password = config.get<string>('REDIS_PASSWORD');
        const db = Number(config.get<string | number>('REDIS_DB', 0));

        return new Redis({
          host,
          port,
          password: password || undefined,
          db,
          maxRetriesPerRequest: null,
        });
      },
    },
    RedisCacheService,
    { provide: CACHE_SERVICE, useExisting: RedisCacheService },
    { provide: CacheService, useExisting: RedisCacheService },
  ],
  exports: [REDIS_CLIENT, CACHE_SERVICE, CacheService, RedisCacheService],
})
export class CacheModule {}
