import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { BullMQService } from './bullmq.service';
import { BULLMQ_CONNECTION } from './queues.constants';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name, opts) => ({
    name,
    opts,
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  })),
}));

describe('BullMQService', () => {
  let service: BullMQService;
  let connectionMock: any;

  beforeEach(async () => {
    connectionMock = { host: 'localhost', port: 6379 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullMQService,
        {
          provide: BULLMQ_CONNECTION,
          useValue: connectionMock,
        },
      ],
    }).compile();

    service = module.get<BullMQService>(BullMQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and cache queues', () => {
    const q1 = service.getQueue('test-queue');
    expect(Queue).toHaveBeenCalledTimes(1);
    expect(Queue).toHaveBeenCalledWith('test-queue', { connection: connectionMock });

    const q2 = service.getQueue('test-queue');
    expect(Queue).toHaveBeenCalledTimes(1); // Should be reused from cache
    expect(q1).toBe(q2);
  });

  it('should add a job to the queue', async () => {
    await service.addJob('test-queue', 'test-job', { foo: 'bar' });
    
    const queueInstance = service.getQueue('test-queue');
    expect(queueInstance.add).toHaveBeenCalledWith('test-job', { foo: 'bar' });
  });
});
