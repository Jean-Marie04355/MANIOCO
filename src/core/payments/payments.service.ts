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
        
        // Update order status to PAID
        await this.ordersService.updateStatus(transaction.orderId, 'PAID' as any);
        
        // Fetch order details for notification
        const order = await this.ordersService.findOne(transaction.orderId);
        if (order) {
          // Fetch customer email
          const customer = await this.userRepository.findOne({ id: order.customerId });
          if (customer) {
            // Queue order confirmation email
            const queueToken = process.env.QUEUE_NAME || 'default';
            await this.queueService.addJob(queueToken, 'send-order-confirmation', {
              email: customer.email,
              orderId: order.id,
              totalAmount: order.totalAmount,
              items: order.items,
            });
            this.logger.log(`Order confirmation queued for ${customer.email}`);
          }
        }
        
        this.logger.log(`Payment approved for transaction ${result.externalId}`);
      }
    } else if (result && result.status === 'DECLINED') {
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
        
        this.logger.warn(`Payment declined/canceled for transaction ${result.externalId}. Order cancelled.`);
      }
    }
  }
}
