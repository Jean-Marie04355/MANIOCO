import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Transaction } from './transaction.entity';
import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly fedapayUrl: string;
  private readonly secretKey: string;

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: IBaseRepository<Transaction>,
    private readonly configService: ConfigService,
  ) {
    const env = this.configService.get<string>(
      'FEDAPAY_ENVIRONMENT',
      'sandbox',
    );
    this.fedapayUrl =
      env === 'live'
        ? 'https://api.fedapay.com/v1'
        : 'https://sandbox-api.fedapay.com/v1';
    this.secretKey = this.configService.get<string>('FEDAPAY_SECRET_KEY', '');
  }

  /**
   * Creates a transaction with split-payment on FedaPay
   */
  async createFedaPayTransaction(
    order: Order,
    sellerPayoutAccountId: string,
  ): Promise<{ transactionId: string; url: string }> {
    const commissionPercent = this.configService.get<number>(
      'PLATFORM_COMMISSION_PERCENT',
      10,
    );
    const amount = Number(order.totalAmount);
    const platformCommission = Math.round((amount * commissionPercent) / 100);

    this.logger.log(
      `Initiating FedaPay payment: Amount=${amount}, Commission=${platformCommission}, Seller=${sellerPayoutAccountId}`,
    );

    // Create local transaction record
    const localTx = await this.transactionRepository.create({
      orderId: order.id,
      amount: amount,
      status: 'PENDING',
    });

    try {
      const response = await fetch(`${this.fedapayUrl}/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Afrigari Order #${order.id}`,
          currency: { iso: 'XOF' },
          callback_url:
            this.configService.get('FRONTEND_URL', 'http://localhost:3000') +
            `/payment-callback?orderId=${order.id}`,
          subaccount: { id: sellerPayoutAccountId },
          commission: platformCommission,
          include: 'payouts',
        }),
      });

      const data = await response.json();
      this.logger.debug('FedaPay API Response: ' + JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Error creating FedaPay transaction');
      }

      // Extract transaction ID (key "v1/transaction" or "transaction")
      const transactionData = data['v1/transaction'] || data['transaction'];
      if (!transactionData) {
        throw new Error('Unknown FedaPay response format');
      }

      // Update with external reference
      await this.transactionRepository.update(localTx.id, {
        externalId: String(transactionData.id),
      });

      // Return the payment URL directly if present (faster than requesting a token)
      if (transactionData.payment_url) {
        return {
          transactionId: transactionData.id,
          url: transactionData.payment_url,
        };
      }

      // Otherwise, generate a token
      const tokenResponse = await fetch(
        `${this.fedapayUrl}/transactions/${transactionData.id}/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const tokenData = await tokenResponse.json();
      const tokenInfo = tokenData['v1/token'] || tokenData['token'];

      return {
        transactionId: transactionData.id,
        url: tokenInfo.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`FedaPay Error: ${error.message}`);
      } else {
        this.logger.error(`FedaPay Error: ${String(error)}`);
      }
      throw error;
    }
  }

  async findByOrderId(orderId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({ orderId });
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    const { entity, event } = payload as { entity: Record<string, unknown>; event: string };

    if (
      event === 'transaction.approved' ||
      event === 'transaction.successful'
    ) {
      const externalId = `${entity.id}`;
      const transaction = await this.transactionRepository.findOne({
        externalId,
      });

      if (transaction) {
        await this.transactionRepository.update(transaction.id, {
          status: 'APPROVED',
          paymentMethod: `${entity.mode}`,
        });
        this.logger.log(`Payment approved for transaction ${externalId}`);
      }
    }
  }
}
