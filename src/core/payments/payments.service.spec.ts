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
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'FEDAPAY_ENVIRONMENT') return 'sandbox';
        if (key === 'FEDAPAY_SECRET_KEY') return 'sk_test_123';
        if (key === 'PLATFORM_COMMISSION_PERCENT') return 10;
        return defaultValue || null;
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

    it('should request a token if payment_url is missing', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            transaction: { id: 'feda-1' } // No payment_url
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: { url: 'http://pay.me/token' }
          }),
        });

      const result = await service.createFedaPayTransaction(order as any, sellerAcc);
      expect(result.url).toBe('http://pay.me/token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error if FedaPay response is not ok', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(service.createFedaPayTransaction(order as any, sellerAcc)).rejects.toThrow('Bad request');
    });

    it('should throw error if transaction data is missing', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ something_else: {} }),
      });

      await expect(service.createFedaPayTransaction(order as any, sellerAcc)).rejects.toThrow('Unknown FedaPay response format');
    });

    it('should handle fetch errors', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.createFedaPayTransaction(order as any, sellerAcc)).rejects.toThrow('Network error');
    });
  });

  describe('findByOrderId', () => {
    it('should find transaction by order id', async () => {
      transactionRepoMock.findOne.mockResolvedValue({ id: 'tx-1' });
      const result = await service.findByOrderId('order-1');
      expect(result).toEqual({ id: 'tx-1' });
      expect(transactionRepoMock.findOne).toHaveBeenCalledWith({ orderId: 'order-1' });
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

    it('should update transaction status when successful', async () => {
      const payload = {
        event: 'transaction.successful',
        entity: { id: 'feda-1', mode: 'card' }
      };
      transactionRepoMock.findOne.mockResolvedValue({ id: 'local-1' });

      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).toHaveBeenCalledWith('local-1', expect.objectContaining({
        status: 'APPROVED',
      }));
    });

    it('should do nothing if event is not approved/successful', async () => {
      const payload = { event: 'transaction.failed', entity: { id: 'feda-1' } };
      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).not.toHaveBeenCalled();
    });

    it('should do nothing if transaction not found locally', async () => {
      const payload = { event: 'transaction.approved', entity: { id: 'feda-1' } };
      transactionRepoMock.findOne.mockResolvedValue(null);
      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).not.toHaveBeenCalled();
    });
  });
});
