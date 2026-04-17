import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

describe('LocationController', () => {
  let controller: LocationController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      getDistance: jest.fn(),
      calculateDeliveryFee: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        { provide: LocationService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getDistance', () => {
    serviceMock.getDistance.mockReturnValue(10.5);
    const result = controller.getDistance(1, 2, 3, 4);
    expect(result.distance).toBe(10.5);
    expect(serviceMock.getDistance).toHaveBeenCalledWith(1, 2, 3, 4);
  });

  it('should call calculateDeliveryFee', () => {
    serviceMock.calculateDeliveryFee.mockReturnValue(2000);
    const result = controller.getDeliveryFee(10);
    expect(result.fee).toBe(2000);
    expect(serviceMock.calculateDeliveryFee).toHaveBeenCalledWith(10);
  });
});
