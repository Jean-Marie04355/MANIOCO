import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentResponse, WebhookResult } from '../../common/interfaces/payment-provider.interface';

@Injectable()
export class FedaPayProvider implements IPaymentProvider {
  private readonly logger = new Logger(FedaPayProvider.name);
  private readonly fedapayUrl: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    const env = this.configService.get<string>('FEDAPAY_ENVIRONMENT', 'sandbox');
    this.fedapayUrl =
      env === 'live'
        ? 'https://api.fedapay.com/v1'
        : 'https://sandbox-api.fedapay.com/v1';
    this.secretKey = this.configService.getOrThrow<string>('FEDAPAY_SECRET_KEY');
  }

  async createTransaction(params: {
    amount: number;
    description: string;
    callbackUrl: string;
    sellerPayoutAccountId?: string;
    orderId: string;
  }): Promise<PaymentResponse> {
    this.logger.log(`Initiating FedaPay transaction for order #${params.orderId}`);

    try {
      const response = await fetch(`${this.fedapayUrl}/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          description: params.description,
          currency: { iso: 'XOF' },
          callback_url: params.callbackUrl,
          subaccount: params.sellerPayoutAccountId ? { id: params.sellerPayoutAccountId } : undefined,
          commission: this.configService.get<number>('PLATFORM_COMMISSION_PERCENT', 10),
          include: 'payouts',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error creating FedaPay transaction');
      }

      const transactionData = data['v1/transaction'] || data['transaction'];
      
      // Return direct URL or generate token
      if (transactionData.payment_url) {
        return {
          transactionId: String(transactionData.id),
          url: transactionData.payment_url,
        };
      }

      // Fallback: Generate Token
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
        transactionId: String(transactionData.id),
        url: tokenInfo.url,
      };
    } catch (error) {
      this.logger.error(`FedaPay API Error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async verifyNotification(payload: Record<string, any>): Promise<WebhookResult | null> {
    const { entity, event } = payload;

    if (
      event === 'transaction.approved' ||
      event === 'transaction.successful'
    ) {
      return {
        externalId: String(entity.id),
        status: 'APPROVED',
        mode: String(entity.mode),
      };
    }

    if (
      event === 'transaction.canceled' ||
      event === 'transaction.declined' ||
      event === 'transaction.expired'
    ) {
      return {
        externalId: String(entity.id),
        status: 'DECLINED',
        mode: String(entity.mode),
      };
    }

    return null;
  }
}
