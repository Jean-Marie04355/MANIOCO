import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../../common/enum/order-status.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let serviceMock: any;

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
    it('should call service.findAll', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(serviceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1');
      expect(result).toEqual({ id: '1' });
      expect(serviceMock.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByCustomer', () => {
    it('should call service.findByCustomer', async () => {
      serviceMock.findByCustomer.mockResolvedValue([]);
      const result = await controller.findByCustomer('c1');
      expect(result).toEqual([]);
      expect(serviceMock.findByCustomer).toHaveBeenCalledWith('c1');
    });
  });

  describe('findByStore', () => {
    it('should call service.findByStore', async () => {
      serviceMock.findByStore.mockResolvedValue([]);
      const result = await controller.findByStore('s1');
      expect(result).toEqual([]);
      expect(serviceMock.findByStore).toHaveBeenCalledWith('s1');
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus', async () => {
      serviceMock.updateStatus.mockResolvedValue({ id: '1', status: OrderStatus.DELIVERED });
      const result = await controller.updateStatus('1', OrderStatus.DELIVERED);
      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(serviceMock.updateStatus).toHaveBeenCalledWith('1', OrderStatus.DELIVERED);
    });
  });
});
