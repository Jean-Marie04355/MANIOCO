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

  async getQueueStats(name: string) {
    const queue = this.getQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  // BullMQ doesn't have a native listQueues, so we use common ones + ones we know
  async getAllQueuesStats() {
    const names = Array.from(new Set(['default', ...this.queues.keys()]));
    return Promise.all(names.map(name => this.getQueueStats(name)));
  }
}

