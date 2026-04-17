import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Response } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Generic payment webhook' })
  async handleWebhook(@Body() payload: Record<string, unknown>, @Res() res: Response) {
    this.logger.log('Payment notification received');

    try {
      // if the provider provides it for better security.
      await this.paymentsService.handleWebhook(payload);

      return res.status(HttpStatus.OK).send('OK');
    } catch (error) {
      this.logger.error(`Webhook Error: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
    }
  }
}
