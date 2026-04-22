import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../../common/enum/order-status.enum';
import { UserRole } from '../../common/enum/role.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let serviceMock: any;

  const adminUser = { email: 'admin@test.com', role: UserRole.ADMIN, userId: 'admin-1' };

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCustomer: jest.fn(),
      findByStore: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: serviceMock }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { storeId: '1', items: [] };
      serviceMock.create.mockResolvedValue({ id: '1' });
      const result = await controller.create(dto as any);
      expect(result).toEqual({ id: '1' });
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with user', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      const result = await controller.findAll(adminUser);
      expect(result).toEqual([]);
      expect(serviceMock.findAll).toHaveBeenCalledWith(adminUser);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with user', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1', adminUser);
      expect(result).toEqual({ id: '1' });
      expect(serviceMock.findOne).toHaveBeenCalledWith('1', adminUser);
    });
  });

  describe('findByCustomer', () => {
    it('should call service.findByCustomer with user', async () => {
      serviceMock.findByCustomer.mockResolvedValue([]);
      const result = await controller.findByCustomer('c1', adminUser);
      expect(result).toEqual([]);
      expect(serviceMock.findByCustomer).toHaveBeenCalledWith('c1', adminUser);
    });
  });

  describe('findByStore', () => {
    it('should call service.findByStore with user', async () => {
      serviceMock.findByStore.mockResolvedValue([]);
      const result = await controller.findByStore('s1', adminUser);
      expect(result).toEqual([]);
      expect(serviceMock.findByStore).toHaveBeenCalledWith('s1', adminUser);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus with user', async () => {
      serviceMock.updateStatus.mockResolvedValue({ id: '1', status: OrderStatus.DELIVERED });
      const result = await controller.updateStatus('1', OrderStatus.DELIVERED, adminUser);
      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(serviceMock.updateStatus).toHaveBeenCalledWith('1', OrderStatus.DELIVERED, adminUser);
    });
  });
});
