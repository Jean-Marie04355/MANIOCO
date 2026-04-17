import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RolesController', () => {
  let controller: RolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockService,
        },
        Reflector,
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<RolesController>(RolesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should format findAll response', async () => {
    mockService.findAll.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(result).toEqual([]);
  });

  it('should format create response', async () => {
    const data = { name: 'test' };
    mockService.create.mockResolvedValue(data);
    const result = await controller.create(data);
    expect(result).toEqual(data);
  });

  it('should format update response', async () => {
    const data = { name: 'updated' };
    mockService.update.mockResolvedValue(data);
    const result = await controller.update('1', data);
    expect(result).toEqual(data);
  });

  it('should format remove response', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove('1');
    expect(mockService.remove).toHaveBeenCalledWith('1');
  });
});
