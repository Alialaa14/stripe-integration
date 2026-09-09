import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from './stripe.constants';
import Stripe = require('stripe');
@Injectable()
export class StripeService {
  constructor(@Inject(STRIPE_CLIENT) public readonly client: Stripe) {}

  withIdempotencyKey(key?: string): Stripe.RequestOptions {
    return key ? { idempotencyKey: key } : {};
  }

  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.client.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }
}
