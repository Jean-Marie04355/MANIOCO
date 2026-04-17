import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let transactionRepoMock: any;
  let configServiceMock: any;
  let userRepoMock: any;
  let paymentProviderMock: any;
  let ordersServiceMock: any;
  let queueServiceMock: any;

  beforeEach(async () => {
    transactionRepoMock = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    userRepoMock = {
      findOne: jest.fn(),
    };
    paymentProviderMock = {
      createTransaction: jest.fn(),
      verifyNotification: jest.fn(),
    };
    ordersServiceMock = {
      updateStatus: jest.fn(),
      findOne: jest.fn(),
      cancelOrder: jest.fn(),
    };
    queueServiceMock = {
      addJob: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'PAYMENT_ENVIRONMENT') return 'sandbox';
        if (key === 'PAYMENT_SECRET_KEY') return 'sk_test_123';
        if (key === 'PLATFORM_COMMISSION_PERCENT') return 10;
        return defaultValue || null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: 'TRANSACTION_REPOSITORY', useValue: transactionRepoMock },
        { provide: 'USER_REPOSITORY', useValue: userRepoMock },
        { provide: 'PAYMENT_PROVIDER', useValue: paymentProviderMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: 'QUEUE_SERVICE', useValue: queueServiceMock },
        { provide: OrdersService, useValue: ordersServiceMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    const order = { id: 'order-1', totalAmount: 1000 };
    const sellerAcc = 'acc-123';

    it('should create a local transaction and return payment URL', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      paymentProviderMock.createTransaction.mockResolvedValue({
        transactionId: 'ext-1',
        url: 'http://pay.me',
      });

      const result = await service.createTransaction(order as any, sellerAcc);
      expect(result.url).toBe('http://pay.me');
      expect(transactionRepoMock.create).toHaveBeenCalled();
      expect(paymentProviderMock.createTransaction).toHaveBeenCalled();
      expect(transactionRepoMock.update).toHaveBeenCalledWith('local-1', {
        externalId: 'ext-1',
      });
    });

    it('should handle errors from payment provider', async () => {
      transactionRepoMock.create.mockResolvedValue({ id: 'local-1' });
      paymentProviderMock.createTransaction.mockRejectedValue(
        new Error('Provider Error'),
      );

      await expect(
        service.createTransaction(order as any, sellerAcc),
      ).rejects.toThrow('Provider Error');
    });
  });

  describe('findByOrderId', () => {
    it('should find transaction by order id', async () => {
      transactionRepoMock.findOne.mockResolvedValue({ id: 'tx-1' });
      const result = await service.findByOrderId('order-1');
      expect(result).toEqual({ id: 'tx-1' });
      expect(transactionRepoMock.findOne).toHaveBeenCalledWith({
        orderId: 'order-1',
      });
    });
  });

  describe('handleWebhook', () => {
    it('should update transaction status when approved', async () => {
      const payload = { some: 'payload' };
      paymentProviderMock.verifyNotification.mockResolvedValue({
        status: 'APPROVED',
        externalId: 'ext-1',
        mode: 'mtn',
      });
      transactionRepoMock.findOne.mockResolvedValue({
        id: 'local-1',
        orderId: 'order-1',
      });
      ordersServiceMock.findOne.mockResolvedValue({
        id: 'order-1',
        customerId: 'cust-1',
      });
      userRepoMock.findOne.mockResolvedValue({ email: 'test@test.com' });

      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).toHaveBeenCalledWith(
        'local-1',
        expect.objectContaining({
          status: 'APPROVED',
          paymentMethod: 'mtn',
        }),
      );
    });

    it('should cancel order and restore stock when declined', async () => {
      const payload = { some: 'payload' };
      paymentProviderMock.verifyNotification.mockResolvedValue({
        status: 'DECLINED',
        externalId: 'ext-1',
      });
      transactionRepoMock.findOne.mockResolvedValue({
        id: 'local-1',
        orderId: 'order-1',
      });

      await service.handleWebhook(payload);
      expect(transactionRepoMock.update).toHaveBeenCalledWith(
        'local-1',
        expect.objectContaining({
          status: 'DECLINED',
        }),
      );
      expect(ordersServiceMock.cancelOrder).toHaveBeenCalledWith('order-1');
    });
  });
});
