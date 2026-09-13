import { Injectable, NotFoundException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../generated/prisma/enums';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto';
import { ListPaymentIntentsDto } from './dto/list-payment-intents.dto';
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto';
import { CustomerService } from '../customer/customer.service';
const paymentStatuses = new Set<string>(Object.values(PaymentStatus));

function toPaymentStatus(status: string): PaymentStatus {
  if (!paymentStatuses.has(status)) {
    throw new Error(`Unsupported Stripe PaymentIntent status: ${status}`);
  }

  return status as PaymentStatus;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  private transformAmountToCent(amount: number): number {
    // Stripe expects the amount in cents so transform dollar(equivalent unit of another currency) amount to cents (equivalent unit of another currency)
    return amount * 100;
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const getUser = await this.prismaService.user.findFirst({
      where: { id: userId },
      include: {
        customer: true,
      },
    });

    if (!getUser) throw new NotFoundException('User does not exist');

    const customer = await this.customerService.createOrGetCustomer(userId);
    const paymentMethod =
      getUser.customer?.defaultPaymentMethodId || dto.paymentMethod;
    const receiptEmail = getUser.email || dto.receiptEmail;

    const paymentIntent = await this.stripeService.client.paymentIntents.create(
      {
        amount: this.transformAmountToCent(dto.amount),
        currency: dto.currency || 'usd',
        customer: customer.stripeCustomerId,
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(paymentMethod !== undefined && {
          payment_method: paymentMethod,
        }),
        ...(receiptEmail !== undefined && { receipt_email: receiptEmail }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    );

    if (!paymentIntent) throw new Error('Failed to create payment intent');
    // save payment intent to database
    await this.prismaService.payment.create({
      data: {
        userId: getUser?.id,
        customerId: getUser.customer?.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: dto.amount,
        currency: paymentIntent.currency,
        status: toPaymentStatus(paymentIntent.status),
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
        receiptEmail: paymentIntent.receipt_email,
        paymentMethodId: paymentIntent.payment_method as string,
      },
    });

    return paymentIntent;
  }

  async updatePaymentIntent(
    paymentIntentId: string,
    userId: string,
    dto: UpdatePaymentIntentDto,
  ) {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId,
      },
    });

    if (!payment) throw new NotFoundException('Payment intent does not exist');

    const paymentIntent = await this.stripeService.client.paymentIntents.update(
      paymentIntentId,
      {
        ...(dto.amount !== undefined && {
          amount: this.transformAmountToCent(dto.amount),
        }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.receiptEmail !== undefined && {
          receipt_email: dto.receiptEmail,
        }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    );

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        amount: dto.amount,
        currency: paymentIntent.currency,
        status: toPaymentStatus(paymentIntent.status),
        description: paymentIntent.description,
        receiptEmail: paymentIntent.receipt_email,
        metadata: paymentIntent.metadata,
      },
    });

    return paymentIntent;
  }

  async retievePaymentIntent(userId: string, paymentIntentId: string) {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId,
      },
    });

    if (!payment)
      throw new NotFoundException(
        'Payment intent does not exist or user does not own it',
      );

    return await this.stripeService.client.paymentIntents.retrieve(
      paymentIntentId,
    );
  }

  async listPaymentIntents(userId: string, dto: ListPaymentIntentsDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) throw new NotFoundException('User does not exist');

    if (!user.customer?.stripeCustomerId) {
      return {
        object: 'list',
        data: [],
        has_more: false,
        url: '/v1/payment_intents',
      };
    }

    if (dto.search) {
      return await this.stripeService.client.paymentIntents.search({
        query: `(${dto.search}) AND customer:'${user.customer.stripeCustomerId}'`,
        ...(dto.limit !== undefined && { limit: dto.limit }),
        ...(dto.page !== undefined && { page: dto.page }),
      });
    }

    const created = {
      ...(dto.createdGte && { gte: this.toUnixTimestamp(dto.createdGte) }),
      ...(dto.createdLte && { lte: this.toUnixTimestamp(dto.createdLte) }),
      ...(dto.createdGt && { gt: this.toUnixTimestamp(dto.createdGt) }),
      ...(dto.createdLt && { lt: this.toUnixTimestamp(dto.createdLt) }),
    };

    return await this.stripeService.client.paymentIntents.list({
      customer: user.customer.stripeCustomerId,
      ...(dto.limit !== undefined && { limit: dto.limit }),
      ...(dto.startingAfter !== undefined && {
        starting_after: dto.startingAfter,
      }),
      ...(dto.endingBefore !== undefined && {
        ending_before: dto.endingBefore,
      }),
      ...(Object.keys(created).length > 0 && { created }),
    });
  }

  async cancelPaymentIntent(
    userId: string,
    paymentIntentId: string,
    dto: CancelPaymentIntentDto,
  ) {
    const payment = await this.prismaService.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        userId,
      },
    });

    if (!payment)
      throw new NotFoundException(
        'Payment intent does not exist or user does not own it',
      );

    const cancelledPaymentIntent =
      await this.stripeService.client.paymentIntents.cancel(paymentIntentId, {
        ...(dto.cancellationReason !== undefined && {
          cancellation_reason: dto.cancellationReason,
        }),
      });

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: toPaymentStatus(cancelledPaymentIntent.status),
        ...(cancelledPaymentIntent.cancellation_reason !== undefined && {
          cancellationReason: dto.cancellationReason,
        }),
      },
    });
  }
  private toUnixTimestamp(value: string): number {
    const timestamp = Math.floor(new Date(value).getTime() / 1000);

    if (Number.isNaN(timestamp)) {
      throw new Error(`Invalid date: ${value}`);
    }

    return timestamp;
  }
}
