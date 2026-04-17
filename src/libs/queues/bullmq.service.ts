import { Inject, Injectable } from '@nestjs/common';
import { Queue, type ConnectionOptions } from 'bullmq';
import { BULLMQ_CONNECTION } from './queues.constants';
import { IQueueService } from '../../common/interfaces/queue.interface';

@Injectable()
export class BullMQService implements IQueueService {
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

  async addJob(queueName: string, jobName: string, data: any): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data);
  }
}

