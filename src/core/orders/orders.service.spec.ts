import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../common/enum/order-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepoMock: any;
  let storeRepoMock: any;
  let productRepoMock: any;
  let paymentsServiceMock: any;

  beforeEach(async () => {
    orderRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    storeRepoMock = {
      findOne: jest.fn(),
    };
    productRepoMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    paymentsServiceMock = {
      createFedaPayTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: 'ORDER_REPOSITORY', useValue: orderRepoMock },
        { provide: 'STORE_REPOSITORY', useValue: storeRepoMock },
        { provide: 'PRODUCT_REPOSITORY', useValue: productRepoMock },
        { provide: PaymentsService, useValue: paymentsServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      storeId: 'store-1',
      customerId: 'customer-1',
      items: [{ productId: 'prod-1', quantity: 2 }],
    };

    it('should throw NotFoundException if store not found', async () => {
      storeRepoMock.findOne.mockResolvedValue(null);
      await expect(service.create(createOrderDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if store has no payoutAccountId', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1', payoutAccountId: null });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product not found', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1', payoutAccountId: 'payout-1' });
      productRepoMock.findOne.mockResolvedValue(null);
      await expect(service.create(createOrderDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product does not belong to store', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1', payoutAccountId: 'payout-1' });
      productRepoMock.findOne.mockResolvedValue({ id: 'prod-1', category: { storeId: 'other-store' } });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1', payoutAccountId: 'payout-1' });
      productRepoMock.findOne.mockResolvedValue({ 
        id: 'prod-1', 
        name: 'Product 1',
        stock: 1, 
        price: 10,
        category: { storeId: 'store-1' } 
      });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should create order and return paymentUrl if everything is OK', async () => {
      const store = { id: 'store-1', payoutAccountId: 'payout-1' };
      const product = { 
        id: 'prod-1', 
        name: 'Product 1', 
        stock: 10, 
        price: 100, 
        category: { storeId: 'store-1' } 
      };
      const order = { id: 'order-1', totalAmount: 200 };

      storeRepoMock.findOne.mockResolvedValue(store);
      productRepoMock.findOne.mockResolvedValue(product);
      orderRepoMock.create.mockResolvedValue(order);
      paymentsServiceMock.createFedaPayTransaction.mockResolvedValue({ url: 'http://payment.url' });

      const result = await service.create(createOrderDto as any);
      
      expect(result.order).toEqual(order);
      expect(result.paymentUrl).toBe('http://payment.url');
      expect(productRepoMock.update).toHaveBeenCalled();
    });
  });

  describe('findAll/findOne', () => {
    it('should find all', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findAll();
      expect(orderRepoMock.find).toHaveBeenCalled();
    });

    it('should throw if findOne fails', async () => {
      orderRepoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and return order', async () => {
      const order = { id: '1', status: OrderStatus.PENDING };
      orderRepoMock.findOne.mockResolvedValue({ ...order, status: OrderStatus.DELIVERED });
      
      const result = await service.updateStatus('1', OrderStatus.DELIVERED);
      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(orderRepoMock.update).toHaveBeenCalledWith('1', { status: OrderStatus.DELIVERED });
    });
  });
});
