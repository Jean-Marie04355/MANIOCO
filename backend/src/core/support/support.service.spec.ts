import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { Ticket } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';

describe('SupportService', () => {
  let service: SupportService;
  let ticketRepoMock: any;
  let messageRepoMock: any;

  beforeEach(async () => {
    ticketRepoMock = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((t) => Promise.resolve({ id: '1', ...t })),
    };

    messageRepoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((m) => Promise.resolve({ id: '1', ...m })),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: 'TICKET_REPOSITORY',
          useValue: ticketRepoMock,
        },
        {
          provide: 'TICKET_MESSAGE_REPOSITORY',
          useValue: messageRepoMock,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all tickets', async () => {
    const tickets = await service.getAllTickets();
    expect(tickets).toEqual([]);
    expect(ticketRepoMock.find).toHaveBeenCalled();
  });
});
