export type CacheSetOptions = {
  ttlSeconds?: number;
};

export abstract class CacheService {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  abstract del(key: string): Promise<number>;
  abstract ping(): Promise<'PONG'>;
}

