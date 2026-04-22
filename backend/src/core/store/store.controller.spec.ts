import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { RolesService } from '../roles/roles.service';

describe('StoreController', () => {
  let controller: StoreController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findNearby: jest.fn(),
      getDeliveryFee: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: serviceMock,
        },
        {
          provide: RolesService,
          useValue: { findByName: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      await controller.findAll('Paris');
      expect(serviceMock.findAll).toHaveBeenCalledWith('Paris');
    });
  });

  describe('findNearby', () => {
    it('should call service.findNearby with numbers', async () => {
      serviceMock.findNearby.mockResolvedValue([]);
      await controller.findNearby(48.8, 2.3, 15);
      expect(serviceMock.findNearby).toHaveBeenCalledWith(48.8, 2.3, 15);
    });
  });

  describe('getDeliveryFee', () => {
    it('should call service.getDeliveryFee', async () => {
      serviceMock.getDeliveryFee.mockResolvedValue({ fee: 100 });
      await controller.getDeliveryFee('s1', 48.8, 2.3);
      expect(serviceMock.getDeliveryFee).toHaveBeenCalledWith('s1', 48.8, 2.3);
    });
  });

  describe('findOne/create/update/remove', () => {
    it('should call findOne', async () => {
      serviceMock.findOne.mockResolvedValue({ id: 's1' });
      await controller.findOne('s1');
      expect(serviceMock.findOne).toHaveBeenCalledWith('s1');
    });

    it('should call create', async () => {
      const dto = { name: 'New' };
      serviceMock.create.mockResolvedValue({ id: 's1' });
      await controller.create(dto as any);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });

    it('should call update', async () => {
      const dto = { name: 'Updated' };
      serviceMock.update.mockResolvedValue({ id: 's1' });
      await controller.update('s1', dto as any);
      expect(serviceMock.update).toHaveBeenCalledWith('s1', dto);
    });

    it('should call remove', async () => {
      serviceMock.remove.mockResolvedValue(true);
      await controller.remove('s1');
      expect(serviceMock.remove).toHaveBeenCalledWith('s1');
    });
  });
});
