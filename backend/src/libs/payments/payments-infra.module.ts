import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FedaPayProvider } from './fedapay.provider';

/**
 * Global module that registers the payment provider implementation.
 * The core PaymentsModule depends on the 'PAYMENT_PROVIDER' token
 * without knowing the concrete implementation (FedaPay, Stripe, etc.).
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    FedaPayProvider,
    {
      provide: 'PAYMENT_PROVIDER',
      useExisting: FedaPayProvider,
    },
  ],
  exports: ['PAYMENT_PROVIDER'],
})
export class PaymentsInfraModule {}
