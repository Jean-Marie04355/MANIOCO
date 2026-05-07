import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { StoreService } from '../store/store.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupportService } from '../support/support.service';
import { ChatService } from '../chat/chat.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus } from '../../common/enum/order-status.enum';
import { UserRole } from '../../common/enum/role.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepoMock: any;
  let storeRepoMock: any;
  let productRepoMock: any;
  let userRepoMock: any;
  let paymentsServiceMock: any;
  let storeServiceMock: any;
  let notificationsServiceMock: any;
  let supportServiceMock: any;
  let chatServiceMock: any;

  const adminUser = {
    id: 'admin-uuid',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    userId: 'admin-1',
  };
  const vendeurUser = {
    id: 'v-uuid',
    email: 'vendeur@test.com',
    role: UserRole.VENDEUR,
    userId: 'vendeur-1',
  };
  const clientUser = {
    id: 'c-uuid',
    email: 'client@test.com',
    role: UserRole.CLIENT,
    userId: 'client-1',
  };

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
    userRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    paymentsServiceMock = {
      createTransaction: jest.fn(),
    };
    storeServiceMock = {
      findByOwnerId: jest.fn(),
    };
    notificationsServiceMock = {
      create: jest.fn(),
    };
    supportServiceMock = {
      countActiveTickets: jest.fn(),
    };
    chatServiceMock = {
      findOrCreateConversation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: 'ORDER_REPOSITORY', useValue: orderRepoMock },
        { provide: 'STORE_REPOSITORY', useValue: storeRepoMock },
        { provide: 'PRODUCT_REPOSITORY', useValue: productRepoMock },
        { provide: 'USER_REPOSITORY', useValue: userRepoMock },
        { provide: PaymentsService, useValue: paymentsServiceMock },
        { provide: StoreService, useValue: storeServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
        { provide: SupportService, useValue: supportServiceMock },
        { provide: ChatService, useValue: chatServiceMock },
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
      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if store has no payoutAccountId', async () => {
      storeRepoMock.findOne.mockResolvedValue({
        id: 'store-1',
        payoutAccountId: null,
      });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if product not found', async () => {
      storeRepoMock.findOne.mockResolvedValue({
        id: 'store-1',
        payoutAccountId: 'payout-1',
      });
      productRepoMock.findOne.mockResolvedValue(null);
      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if product does not belong to store', async () => {
      storeRepoMock.findOne.mockResolvedValue({
        id: 'store-1',
        payoutAccountId: 'payout-1',
      });
      productRepoMock.findOne.mockResolvedValue({
        id: 'prod-1',
        storeId: 'other-store',
      });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      storeRepoMock.findOne.mockResolvedValue({
        id: 'store-1',
        payoutAccountId: 'payout-1',
      });
      productRepoMock.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        stock: 1,
        price: 10,
        storeId: 'store-1',
      });
      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create order and return paymentUrl if everything is OK', async () => {
      const store = { id: 'store-1', payoutAccountId: 'payout-1' };
      const product = {
        id: 'prod-1',
        name: 'Product 1',
        stock: 10,
        price: 100,
        storeId: 'store-1',
      };
      const order = { id: 'order-1', totalAmount: 200 };

      storeRepoMock.findOne.mockResolvedValue(store);
      productRepoMock.findOne.mockResolvedValue(product);
      orderRepoMock.create.mockResolvedValue(order);
      orderRepoMock.findOne.mockResolvedValue(order);
      paymentsServiceMock.createTransaction.mockResolvedValue({
        url: 'http://payment.url',
      });

      userRepoMock.find.mockResolvedValue([]); // For admin notifications
      const result = await service.create(createOrderDto as any);

      expect(result.order).toEqual(order);
      expect(result.paymentUrl).toBe('http://payment.url');
      expect(productRepoMock.update).toHaveBeenCalled();
    });


    it('should cancel order and restore stock if payment initiation fails', async () => {
      const store = { id: 'store-1', payoutAccountId: 'payout-1' };
      const product = {
        id: 'prod-1',
        name: 'Product 1',
        stock: 10,
        price: 100,
        storeId: 'store-1',
      };
      const order = {
        id: 'order-1',
        totalAmount: 200,
        status: OrderStatus.PENDING,
      };

      storeRepoMock.findOne.mockResolvedValue(store);
      productRepoMock.findOne.mockResolvedValue(product);
      orderRepoMock.create.mockResolvedValue(order);
      orderRepoMock.findOne.mockResolvedValue(order);
      paymentsServiceMock.createTransaction.mockRejectedValue(
        new Error('Payment Provider Down'),
      );

      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );

      // Should have called update status to CANCELLED (via cancelOrder)
      expect(orderRepoMock.update).toHaveBeenCalledWith('order-1', {
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Non spécifiée',
      });
    });


    it('should handle non-Error catch block in create', async () => {
      const store = { id: 'store-1', payoutAccountId: 'payout-1' };
      const product = {
        id: 'prod-1',
        stock: 10,
        price: 100,
        storeId: 'store-1',
      };
      const order = { id: 'order-1', status: OrderStatus.PENDING };

      storeRepoMock.findOne.mockResolvedValue(store);
      productRepoMock.findOne.mockResolvedValue(product);
      orderRepoMock.create.mockResolvedValue(order);
      orderRepoMock.findOne.mockResolvedValue(order);
      paymentsServiceMock.createTransaction.mockRejectedValue('String Error');

      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        /String Error/,
      );
    });
  });

  describe('restoreStock', () => {
    it('should restore stock for each item in order', async () => {
      const order = {
        id: 'order-1',
        items: [{ productId: 'prod-1', quantity: 3 }],
      };
      const product = { id: 'prod-1', stock: 10 };

      orderRepoMock.findOne.mockResolvedValue(order);
      productRepoMock.findOne.mockResolvedValue(product);

      await service.restoreStock('order-1');

      expect(productRepoMock.update).toHaveBeenCalledWith('prod-1', {
        stock: 13,
      });
    });

    it('should do nothing if order has no items', async () => {
      orderRepoMock.findOne.mockResolvedValue(null);
      await service.restoreStock('order-unknown');
      expect(productRepoMock.update).not.toHaveBeenCalled();
    });

    it('should skip product if not found during restoration', async () => {
      const order = {
        id: 'order-1',
        items: [{ productId: 'prod-unknown', quantity: 3 }],
      };
      orderRepoMock.findOne.mockResolvedValue(order);
      productRepoMock.findOne.mockResolvedValue(null);

      await service.restoreStock('order-1');
      expect(productRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should update status to CANCELLED and restore stock', async () => {
      const order = { id: 'order-1', status: OrderStatus.PENDING };
      orderRepoMock.findOne.mockResolvedValue(order);
      jest.spyOn(service, 'restoreStock').mockResolvedValue(undefined);

      await service.cancelOrder('order-1');

      expect(orderRepoMock.update).toHaveBeenCalledWith('order-1', {
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Non spécifiée'
      });
      expect(service.restoreStock).toHaveBeenCalledWith('order-1');

    });

    it('should return immediately if order is already CANCELLED', async () => {
      const order = { id: 'order-1', status: OrderStatus.CANCELLED };
      orderRepoMock.findOne.mockResolvedValue(order);

      const result = await service.cancelOrder('order-1');
      expect(result).toEqual(order);
      expect(orderRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('admin should see all orders', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findAll(adminUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        relations: expect.arrayContaining(['customer', 'store']),
        order: { createdAt: 'DESC' }
      }));
    });

    it('vendeur should see only their store orders', async () => {
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1' });
      orderRepoMock.find.mockResolvedValue([]);
      await service.findAll(vendeurUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { storeId: 'store-1' },
        order: { createdAt: 'DESC' }
      }));
    });

    it('client should see only their own orders', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findAll(clientUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { customerId: 'client-1' },
        order: { createdAt: 'DESC' }
      }));
    });
  });


  describe('findOne', () => {
    it('should throw if order not found', async () => {
      orderRepoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('1', adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('admin should access any order', async () => {
      const order = { id: '1', storeId: 'store-1', customerId: 'other' };
      orderRepoMock.findOne.mockResolvedValue(order);
      const result = await service.findOne('1', adminUser);
      expect(result).toEqual(order);
    });

    it('vendeur should be forbidden from accessing other store orders', async () => {
      const order = { id: '1', storeId: 'store-other', customerId: 'c1' };
      orderRepoMock.findOne.mockResolvedValue(order);
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1' });
      await expect(service.findOne('1', vendeurUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('client should be forbidden from accessing other customer orders', async () => {
      const order = { id: '1', storeId: 'store-1', customerId: 'other-client' };
      orderRepoMock.findOne.mockResolvedValue(order);
      await expect(service.findOne('1', clientUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('admin should update status', async () => {
      const order = {
        id: '1',
        status: OrderStatus.PENDING,
        storeId: 's1',
        customerId: 'c1',
      };
      orderRepoMock.findOne.mockResolvedValue({
        ...order,
        status: OrderStatus.DELIVERED,
      });

      const result = await service.updateStatus(
        '1',
        OrderStatus.DELIVERED,
        adminUser,
      );
      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(orderRepoMock.update).toHaveBeenCalledWith('1', {
        status: OrderStatus.DELIVERED,
      });
    });
  });

  describe('updateStatusInternal', () => {
    it('should update status without permission checks', async () => {
      orderRepoMock.findOne.mockResolvedValue({
        id: '1',
        status: OrderStatus.PAID,
      });
      const result = await service.updateStatusInternal('1', OrderStatus.PAID);
      expect(result.status).toBe(OrderStatus.PAID);
      expect(orderRepoMock.update).toHaveBeenCalledWith('1', {
        status: OrderStatus.PAID,
      });
    });
  });

  describe('findByCustomer', () => {
    it('admin should see customer orders', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findByCustomer('c1', adminUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({ 
        where: { customerId: 'c1' },
        order: { createdAt: 'DESC' }
      }));
    });

    it('customer should see their own orders', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findByCustomer('client-1', clientUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { customerId: 'client-1' },
        order: { createdAt: 'DESC' }
      }));
    });

    it('should throw ForbiddenException for other customer orders', async () => {
      await expect(service.findByCustomer('other', clientUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByStore', () => {
    it('admin should see store orders', async () => {
      orderRepoMock.find.mockResolvedValue([]);
      await service.findByStore('s1', adminUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith({ where: { storeId: 's1' } });
    });

    it('vendeur should see their own store orders', async () => {
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 's1' });
      orderRepoMock.find.mockResolvedValue([]);
      await service.findByStore('s1', vendeurUser as any);
      expect(orderRepoMock.find).toHaveBeenCalledWith(expect.objectContaining({ 
        where: { storeId: 's1' },
        order: { createdAt: 'DESC' }
      }));
    });


    it('should throw ForbiddenException if vendeur accesses other store', async () => {
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 's1' });
      await expect(service.findByStore('other', vendeurUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for clients', async () => {
      await expect(service.findByStore('s1', clientUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus - restrictions', () => {
    it('should throw ForbiddenException if client tries to update status', async () => {
      const order = { id: '1', customerId: 'client-1', storeId: 's1' };
      orderRepoMock.findOne.mockResolvedValue(order);
      await expect(
        service.updateStatus('1', OrderStatus.DELIVERED, clientUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return order by ID', async () => {
      const order = { id: '1' };
      orderRepoMock.findOne.mockResolvedValue(order);
      const result = await service.findById('1');
      expect(result).toEqual(order);
    });
  });
});

