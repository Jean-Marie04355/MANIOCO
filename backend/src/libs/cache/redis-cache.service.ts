import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { CacheService, type CacheSetOptions } from './cache.service';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisCacheService extends CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async ping(): Promise<'PONG'> {
    return this.redis.ping();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    const payload = JSON.stringify(value);
    const ttlSeconds = options?.ttlSeconds;

    if (ttlSeconds != null) {
      await this.redis.set(key, payload, 'EX', ttlSeconds);
      return;
    }

    await this.redis.set(key, payload);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }
}
