import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FedaPayProvider } from './fedapay.provider';

describe('FedaPayProvider', () => {
  let provider: FedaPayProvider;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'FEDAPAY_ENVIRONMENT') return 'sandbox';
        if (key === 'FEDAPAY_SECRET_KEY') return 'sk_test_123';
        if (key === 'PLATFORM_COMMISSION_PERCENT') return 10;
        return defaultValue || null;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FedaPayProvider,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<FedaPayProvider>(FedaPayProvider);
    
    // Mock global fetch
    jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a transaction and return the payment URL from response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          'v1/transaction': {
            id: 888,
            payment_url: 'http://fedapay.url/pay/888',
          },
        }),
      });

      const params = {
        amount: 5000,
        description: 'Test order',
        callbackUrl: 'http://cb.com',
        orderId: 'order-123',
      };

      const result = await provider.createTransaction(params);

      expect(result.transactionId).toBe('888');
      expect(result.url).toBe('http://fedapay.url/pay/888');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should fallback to generate token if payment_url is not in transaction response', async () => {
      // First fetch: create transaction
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transaction: { id: 999 }, // No payment_url
        }),
      });

      // Second fetch: get token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: { url: 'http://fedapay.url/token/999' },
        }),
      });

      const result = await provider.createTransaction({
        amount: 1000,
        description: 'Order 2',
        callbackUrl: 'http://cb.com',
        orderId: 'order-456',
      });

      expect(result.transactionId).toBe('999');
      expect(result.url).toBe('http://fedapay.url/token/999');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error if fetch response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid API Key' }),
      });

      await expect(provider.createTransaction({
        amount: 100,
        description: 'D',
        callbackUrl: 'C',
        orderId: 'O',
      })).rejects.toThrow('Invalid API Key');
    });
  });

  describe('verifyNotification', () => {
    it('should return APPROVED status for successful event', async () => {
      const payload = {
        event: 'transaction.successful',
        entity: { id: 777, mode: 'mtn' },
      };
      const result = await provider.verifyNotification(payload);
      expect(result).toEqual({
        externalId: '777',
        status: 'APPROVED',
        mode: 'mtn',
      });
    });

    it('should return DECLINED status for canceled event', async () => {
      const payload = {
        event: 'transaction.canceled',
        entity: { id: 777, mode: 'orange' },
      };
      const result = await provider.verifyNotification(payload);
      expect(result).toEqual({
        externalId: '777',
        status: 'DECLINED',
        mode: 'orange',
      });
    });

    it('should return null for unknown events', async () => {
      const result = await provider.verifyNotification({ event: 'transfer.finished' });
      expect(result).toBeNull();
    });
  });
});
