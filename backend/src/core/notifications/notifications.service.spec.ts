import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repoMock: any;
  let gatewayMock: any;

  beforeEach(async () => {
    repoMock = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((n) => Promise.resolve({ id: '1', ...n })),
    };

    gatewayMock = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: 'NOTIFICATION_REPOSITORY',
          useValue: repoMock,
        },
        {
          provide: RealtimeGateway,
          useValue: gatewayMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all notifications', async () => {
    const notifications = await service.findAllByUser('user1');
    expect(notifications).toEqual([]);
    expect(repoMock.find).toHaveBeenCalled();
  });
});
