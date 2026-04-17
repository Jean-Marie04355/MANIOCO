import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { ConfigService } from '@nestjs/config';

describe('LocationService', () => {
  let service: LocationService;
  let configServiceMock: any;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  describe('getDistance', () => {
    it('should calculate distance between two points', () => {
      // Paris to Lyon (~393km)
      const dist = service.getDistance(48.8566, 2.3522, 45.7640, 4.8357);
      expect(dist).toBeGreaterThan(390);
      expect(dist).toBeLessThan(400);
    });
  });

  describe('calculateDeliveryFee', () => {
    it('should use default fees if config is missing', () => {
      configServiceMock.get.mockReturnValue(null);
      const fee = service.calculateDeliveryFee(10);
      expect(fee).toBe(1500); // 500 + 10 * 100
    });

    it('should use config fees if present', () => {
      configServiceMock.get.mockImplementation((key) => {
        if (key === 'DELIVERY_BASE_FEE') return 1000;
        if (key === 'DELIVERY_PER_KM_FEE') return 200;
        return null;
      });
      const fee = service.calculateDeliveryFee(10);
      expect(fee).toBe(3000); // 1000 + 10 * 200
    });
  });
});
