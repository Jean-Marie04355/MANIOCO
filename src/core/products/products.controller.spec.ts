import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { RolesService } from '../roles/roles.service';
import { UserRole } from '../../common/enum/role.enum';

describe('ProductsController', () => {
  let controller: ProductsController;
  let serviceMock: any;

  const mockAdmin = {
    userId: 'admin-id',
    role: UserRole.ADMIN,
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: serviceMock,
        },
        {
          provide: RolesService,
          useValue: { findByName: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      await controller.findAll();
      expect(serviceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1' });
      await controller.findOne('1');
      expect(serviceMock.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'Prod' };
      serviceMock.create.mockResolvedValue({ id: '1', ...dto });
      await controller.create(dto as any, mockAdmin);
      expect(serviceMock.create).toHaveBeenCalledWith(dto, mockAdmin);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { name: 'Updated' };
      serviceMock.update.mockResolvedValue({ id: '1', ...dto });
      await controller.update('1', dto as any, mockAdmin);
      expect(serviceMock.update).toHaveBeenCalledWith('1', dto, mockAdmin);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      serviceMock.remove.mockResolvedValue(true);
      await controller.remove('1', mockAdmin);
      expect(serviceMock.remove).toHaveBeenCalledWith('1', mockAdmin);
    });
  });
});
