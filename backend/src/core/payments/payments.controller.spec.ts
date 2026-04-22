import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { HttpStatus } from '@nestjs/common';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let serviceMock: jest.Mocked<Partial<PaymentsService>>;

  beforeEach(async () => {
    serviceMock = {
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should return 200 OK when webhook is processed successfully', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWebhook({ event: 'payment.success' }, res);

    expect(serviceMock.handleWebhook).toHaveBeenCalledWith({ event: 'payment.success' });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.send).toHaveBeenCalledWith('OK');
  });

  it('should return 500 when webhook processing fails', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    serviceMock.handleWebhook.mockRejectedValue(new Error('Internal Error'));

    await controller.handleWebhook({}, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.send).toHaveBeenCalledWith('Error');
  });
});
