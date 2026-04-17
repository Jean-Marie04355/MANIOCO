import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { HttpStatus } from '@nestjs/common';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  describe('handleWebhook', () => {
    it('should call service.handleWebhook and return OK', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const payload = { event: 'test' };

      await controller.handleWebhook(payload, res as any);
      expect(serviceMock.handleWebhook).toHaveBeenCalledWith(payload);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should return 500 if service fails', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      serviceMock.handleWebhook.mockRejectedValue(new Error('FAIL'));

      await controller.handleWebhook({}, res as any);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
