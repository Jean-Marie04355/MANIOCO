import { Inject, Injectable } from '@nestjs/common';
import { Queue, type ConnectionOptions } from 'bullmq';
import { BULLMQ_CONNECTION } from './queues.constants';

@Injectable()
export class BullMQService {
  private readonly queues = new Map<string, Queue>();

  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly connection: ConnectionOptions,
  ) {}

  getQueue(name: string): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing;

    const queue = new Queue(name, { connection: this.connection });
    this.queues.set(name, queue);
    return queue;
  }
}

