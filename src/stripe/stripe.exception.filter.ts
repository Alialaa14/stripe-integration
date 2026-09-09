import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import Stripe from 'stripe';

const STATUS_BY_TYPE: Partial<
  Record<Stripe.errors.StripeError['type'], number>
> = {
  StripeCardError: HttpStatus.PAYMENT_REQUIRED, // 402 - card was declined etc.
  StripeInvalidRequestError: HttpStatus.BAD_REQUEST, // 400 - bad params, missing resource
  StripeAPIError: HttpStatus.BAD_GATEWAY, // 502 - something went wrong on Stripe's end
  StripeConnectionError: HttpStatus.SERVICE_UNAVAILABLE, // 503 - network issue talking to Stripe
  StripeAuthenticationError: HttpStatus.INTERNAL_SERVER_ERROR, // 500 - bad API key, our bug not the caller's
  StripeRateLimitError: HttpStatus.TOO_MANY_REQUESTS, // 429
  StripeIdempotencyError: HttpStatus.CONFLICT, // 409 - key reused with different params
};

@Catch(Stripe.errors.StripeError)
export class StripeExceptionFilter implements ExceptionFilter {
  catch(exception: Stripe.errors.StripeError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      STATUS_BY_TYPE[exception.type] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      stripeType: exception.type,
      code: exception.code, // e.g. 'card_declined', 'resource_missing'
      message: exception.message,
      requestId: (exception as any).requestId, // handy when contacting Stripe support
    });
  }
}
