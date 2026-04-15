import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let transactionRepoMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    transactionRepoMock = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'FEDAPAY_ENVIRONMENT') return 'sandbox';
        if (key === 'FEDAPAY_SECRET_KEY') return 'sk_test_123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: 'TRANSACTION_REPOSITORY', useValue: transactionRepoMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    
    // Global fetch mock
    (global as any).fetch = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFedaPayTransaction', () => {
    const order = { id: 'order-1', totalAmount: 1000 };
    const sellerAcc = 'acc-123';

    it('should create a local transaction and return payment URL', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          transaction: { id: 'feda-1', payment_url: 'http://pay.me' }
        }),
      });

      const result = await service.createFedaPayTransaction(order as any, sellerAcc);
      expect(result.url).toBe('http://pay.me');
      expect(transactionRepoMock.create).toHaveBeenCalled();
      expect(transactionRepoMock.update).toHaveBeenCalledWith('local-1', { externalId: 'feda-1' });
    });
  });

  describe('handleWebhook', () => {
    it('should update transaction status when approved', async () => {
      const payload = {
        event: 'transaction.approved',
        entity: { id: 'feda-1', mode: 'mtn' }
      };
      transactionRepoMock.findOne.mockResolvedValue({ id: 'local-1' });

      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).toHaveBeenCalledWith('local-1', expect.objectContaining({
        status: 'APPROVED',
        paymentMethod: 'mtn'
      }));
    });
  });
});
