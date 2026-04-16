import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Transaction } from './transaction.entity';
import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/order.entity';
import { IPaymentProvider } from '../../common/interfaces/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: IBaseRepository<Transaction>,
    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: IPaymentProvider,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a transaction with split-payment
   */
  async createTransaction(
    order: Order,
    sellerPayoutAccountId: string,
  ): Promise<{ transactionId: string; url: string }> {
    const amount = Number(order.totalAmount);

    // Create local transaction record
    const localTx = await this.transactionRepository.create({
      orderId: order.id,
      amount: amount,
      status: 'PENDING',
    });

    try {
      const callbackUrl =
        this.configService.get('FRONTEND_URL', 'http://localhost:3000') +
        `/payment-callback?orderId=${order.id}`;

      // Delegate to external provider
      const paymentResponse = await this.paymentProvider.createTransaction({
        amount,
        description: `Afrigari Order #${order.id}`,
        callbackUrl,
        sellerPayoutAccountId,
        orderId: order.id,
      });

      // Update with external reference
      await this.transactionRepository.update(localTx.id, {
        externalId: paymentResponse.transactionId,
      });

      return {
        transactionId: paymentResponse.transactionId,
        url: paymentResponse.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Payment Initiation Error: ${error.message}`);
      } else {
        this.logger.error(`Payment Initiation Error: ${String(error)}`);
      }
      throw error;
    }
  }

  async findByOrderId(orderId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({ orderId });
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    const result = await this.paymentProvider.verifyNotification(payload);

    if (result && result.status === 'APPROVED') {
      const transaction = await this.transactionRepository.findOne({
        externalId: result.externalId,
      });

      if (transaction) {
        await this.transactionRepository.update(transaction.id, {
          status: 'APPROVED',
          paymentMethod: result.mode || 'unknown',
        });
        this.logger.log(`Payment approved for transaction ${result.externalId}`);
      }
    }
  }
}
