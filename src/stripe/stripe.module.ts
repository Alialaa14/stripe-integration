import { Global, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe.constants';
@Global()
@Module({
  providers: [
    StripeService,
    {
      provide: STRIPE_CLIENT,
      useFactory: (configService: ConfigService) => {
        const stripeSecretKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
          throw new Error(
            'STRIPE_SECRET_KEY is not defined in the environment variables',
          );
        }
        return new Stripe(stripeSecretKey, {
          apiVersion: '2026-08-26.dahlia',
          appInfo: {
            name: 'Stripe Integration',
            version: '1.0.0',
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [STRIPE_CLIENT, StripeService],
  imports: [ConfigModule],
  controllers: [],
})
export class StripeModule {}
