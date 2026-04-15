import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { ConnectionOptions } from 'bullmq';
import { BullMQService } from './bullmq.service';
import { BULLMQ_CONNECTION } from './queues.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: BULLMQ_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ConnectionOptions => {
        const url = config.get<string>('REDIS_URL');
        if (url) {
          return { url };
        }

        const host = config.get<string>('REDIS_HOST', '127.0.0.1');
        const port = Number(config.get<string | number>('REDIS_PORT', 6379));
        const password = config.get<string>('REDIS_PASSWORD');
        const db = Number(config.get<string | number>('REDIS_DB', 0));

        return {
          host,
          port,
          password: password || undefined,
          db,
        };
      },
    },
    BullMQService,
  ],
  exports: [BULLMQ_CONNECTION, BullMQService],
})
export class QueuesModule {}

