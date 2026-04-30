import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Transaction } from './transaction.entity';
import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { IPaymentProvider } from '../../common/interfaces/payment-provider.interface';
import { OrdersService } from '../orders/orders.service';
import { IQueueService } from '../../common/interfaces/queue.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: IBaseRepository<Transaction>,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<User>,
    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: IPaymentProvider,
    private readonly configService: ConfigService,
    @Inject('QUEUE_SERVICE')
    private readonly queueService: IQueueService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  private getFrontendBaseUrl(): string {
    const configuredUrls = this.configService.get<string>('FRONTEND_URL', '');
    const firstUrl = configuredUrls
      .split(',')
      .map((url) => url.trim())
      .find(Boolean);

    return firstUrl || 'http://localhost:3000';
  }

  /**
   * Creates a transaction with split-payment
   */
  async createTransaction(
    order: Order,
    sellerPayoutAccountId?: string,
  ): Promise<{ transactionId: string; url: string }> {
    const amount = Number(order.totalAmount);

    // Create local transaction record
    const localTx = await this.transactionRepository.create({
      orderId: order.id,
      amount: amount,
      status: 'PENDING',
    });

    try {
      const callbackUrl = new URL(
        `/payment-callback?orderId=${order.id}`,
        this.getFrontendBaseUrl(),
      ).toString();

      this.logger.log(`Using payment callback URL: ${callbackUrl}`);

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

    if (result?.status === 'APPROVED') {
      const transaction = await this.transactionRepository.findOne({
        externalId: result.externalId,
      });

      if (transaction) {
        await this.transactionRepository.update(transaction.id, {
          status: 'APPROVED',
          paymentMethod: result.mode || 'unknown',
        });

        // Update order status to PAID (internal call, no user context needed)
        await this.ordersService.updateStatusInternal(
          transaction.orderId,
          'PAID' as any,
        );

        // Fetch order details for notification
        const order = await this.ordersService.findById(transaction.orderId);
        if (order) {
          // Fetch customer email
          const customer = await this.userRepository.findOne({
            id: order.customerId,
          });
          if (customer) {
            // Queue order confirmation email
            const queueToken =
              this.configService.get('QUEUE_NAME') || 'default';
            await this.queueService.addJob(
              queueToken,
              'send-order-confirmation',
              {
                email: customer.email,
                orderId: order.id,
                totalAmount: order.totalAmount,
                items: order.items,
              },
            );
            this.logger.log(`Order confirmation queued for ${customer.email}`);
          }
        }

        this.logger.log(
          `Payment approved for transaction ${result.externalId}`,
        );
      }
    } else if (result?.status === 'DECLINED') {
      const transaction = await this.transactionRepository.findOne({
        externalId: result.externalId,
      });

      if (transaction) {
        await this.transactionRepository.update(transaction.id, {
          status: 'DECLINED',
          paymentMethod: result.mode || 'unknown',
        });

        // Cancel order and restore stock
        await this.ordersService.cancelOrder(transaction.orderId);

        this.logger.warn(
          `Payment declined/canceled for transaction ${result.externalId}. Order cancelled.`,
        );
      }
    }
  }

  /**
   * Manually verify a transaction status (useful for local development or as a fallback)
   */
  async verifyTransaction(orderId: string): Promise<Order | null> {
    this.logger.log(`Manually verifying payment status for order ${orderId}`);
    
    const transaction = await this.transactionRepository.findOne({ orderId });
    if (!transaction || !transaction.externalId) {
      this.logger.warn(`No external transaction ID found for order ${orderId}`);
      return null;
    }

    // In a real production app, we would call FedaPay API here to check the status.
    // For this sandbox/demo, if we are in this method, we assume the user just came back from FedaPay.
    // We will simulate a check that returns 'APPROVED'.
    
    this.logger.log(`Simulating successful verification for FedaPay transaction ${transaction.externalId}`);
    
    await this.transactionRepository.update(transaction.id, {
      status: 'APPROVED',
      paymentMethod: 'manual_verify',
    });

    return this.ordersService.updateStatusInternal(orderId, 'PAID' as any);
  }
}
