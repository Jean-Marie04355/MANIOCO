export interface PaymentResponse {
  transactionId: string;
  url: string;
}

export interface WebhookResult {
  externalId: string;
  status: 'APPROVED' | 'DECLINED' | 'PENDING';
  mode?: string;
}

export interface IPaymentProvider {
  createTransaction(params: {
    amount: number;
    description: string;
    callbackUrl: string;
    sellerPayoutAccountId?: string;
    orderId: string;
    customer?: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phoneNumber?: string;
    };
  }): Promise<PaymentResponse>;

  verifyNotification(
    payload: Record<string, any>,
  ): Promise<WebhookResult | null>;
}
