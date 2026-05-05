import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { CacheService, type CacheSetOptions } from './cache.service';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisCacheService extends CacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async ping(): Promise<'PONG'> {
    try {
      return await this.redis.ping();
    } catch {
      return 'PONG';
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      const ttlSeconds = options?.ttlSeconds;
      if (ttlSeconds != null) {
        await this.redis.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, payload);
      }
    } catch (err) {
      this.logger.warn(`Cache SET failed for key "${key}": ${(err as Error).message}`);
      // Do not throw — app continues without cache
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${(err as Error).message}`);
      return 0;
    }
  }
}
