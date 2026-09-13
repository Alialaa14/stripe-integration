import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutMode, CheckoutSessionStatus } from '../generated/prisma/enums';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { UpdateCheckoutSessionDto } from './dto/update-checkout-session.dto';
import { ListCheckoutSessionsDto } from './dto/list-checkout-sessions.dto';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  private async checkProductPricesIds(
    lineItems: { priceId: string; quantity: number }[],
  ) {
    const prices = await this.prismaService.price.findMany({
      where: {
        stripePriceId: { in: lineItems.map((item) => item.priceId) },
        active: true,
      },
    });
    const pricesByStripeId = new Map(
      prices.map((price) => [price.stripePriceId, price]),
    );
    const requestedPriceIds = new Set(lineItems.map((item) => item.priceId));

    if (prices.length !== requestedPriceIds.size) {
      throw new NotFoundException(
        'One or more prices do not exist or are inactive',
      );
    }
    return {
      pricesByStripeId,
      requestedPriceIds,
    };
  }
  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) throw new NotFoundException('User does not exist');

    const customer = await this.customerService.createOrGetCustomer(userId);

    const { pricesByStripeId, requestedPriceIds } =
      await this.checkProductPricesIds(dto.lineItems);

    const session = await this.stripeService.client.checkout.sessions.create({
      customer: customer.stripeCustomerId,
      line_items: dto.lineItems.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      mode: 'payment',
      permissions: {},
      success_url: dto.successUrl || 'http://localhost:3000/success',
      cancel_url: dto.cancelUrl || 'http://localhost:3000/cancel',
      metadata: { userId },
    });

    await this.prismaService.checkoutSession.create({
      data: {
        stripeCheckoutSessionId: session.id,
        userId,
        customerId: customer.id,
        status: CheckoutSessionStatus.open,
        mode: CheckoutMode.payment,
        currency: dto.currency,
        amountTotal: session.amount_total,
        url: session.url,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000)
          : undefined,
        lineItems: {
          create: dto.lineItems.map((item) => ({
            priceId: pricesByStripeId.get(item.priceId)!.id,
            quantity: item.quantity,
          })),
        },
      },
    });

    return session;
  }
  async retrieveCheckoutSession(userId: string, checkoutSessionId: string) {
    const checkoutSession = await this.prismaService.checkoutSession.findFirst({
      where: {
        stripeCheckoutSessionId: checkoutSessionId,
        userId,
      },
    });

    if (!checkoutSession) {
      throw new NotFoundException(
        'Checkout session does not exist or user does not own it',
      );
    }

    return this.stripeService.client.checkout.sessions.retrieve(
      checkoutSession.stripeCheckoutSessionId,
      {
        expand: ['line_items.data.price.product'],
      },
    );
  }

  async listCheckoutSessions(userId: string, dto: ListCheckoutSessionsDto) {
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
        url: '/v1/checkout/sessions',
      };
    }

    const created = {
      ...(dto.createdGte && { gte: this.toUnixTimestamp(dto.createdGte) }),
      ...(dto.createdLte && { lte: this.toUnixTimestamp(dto.createdLte) }),
      ...(dto.createdGt && { gt: this.toUnixTimestamp(dto.createdGt) }),
      ...(dto.createdLt && { lt: this.toUnixTimestamp(dto.createdLt) }),
    };

    return this.stripeService.client.checkout.sessions.list({
      customer: user.customer.stripeCustomerId,
      ...(dto.limit !== undefined && { limit: dto.limit }),
      ...(dto.startingAfter !== undefined && {
        starting_after: dto.startingAfter,
      }),
      ...(dto.endingBefore !== undefined && {
        ending_before: dto.endingBefore,
      }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(Object.keys(created).length > 0 && { created }),
      expand: ['data.line_items.data.price.product'],
    });
  }

  async updateCheckoutSession(
    userId: string,
    checkoutSessionId: string,
    dto: UpdateCheckoutSessionDto,
  ) {
    const checkoutSession = await this.prismaService.checkoutSession.findUnique(
      {
        where: { stripeCheckoutSessionId: checkoutSessionId, userId },
        include: {
          lineItems: { include: { price: true } },
          customer: true,
        },
      },
    );

    if (!checkoutSession) {
      throw new NotFoundException(
        'Checkout session does not exist or user does not own it',
      );
    }

    if (checkoutSession.status !== CheckoutSessionStatus.open) {
      throw new BadRequestException('Checkout session is not open');
    }

    const { pricesByStripeId } = await this.checkProductPricesIds(
      dto.lineItems,
    );

    let isIdenticalLineItems = false;
    if (checkoutSession.lineItems.length === dto.lineItems.length) {
      isIdenticalLineItems = checkoutSession.lineItems.every((item, index) => {
        return (
          item.priceId === dto.lineItems[index].priceId &&
          item.quantity === dto.lineItems[index].quantity
        );
      });
    }

    if (isIdenticalLineItems) {
      throw new BadRequestException(
        'No changes were made to the checkout session',
      );
    }

    // Hosted Checkout can't update line_items in place — expire and recreate instead
    await this.stripeService.client.checkout.sessions.expire(
      checkoutSession.stripeCheckoutSessionId,
    );

    const customer = await this.customerService.createOrGetCustomer(userId);

    const newSession = await this.stripeService.client.checkout.sessions.create(
      {
        customer: customer.stripeCustomerId,
        line_items: dto.lineItems.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    );

    // Update the DB row to point at the new Stripe session
    const updated = await this.prismaService.checkoutSession.update({
      where: {
        stripeCheckoutSessionId: checkoutSession.stripeCheckoutSessionId,
      },
      data: {
        stripeCheckoutSessionId: newSession.id,
        customerId: customer.id,
        url: newSession.url,
        amountTotal: newSession.amount_total,
        expiresAt: newSession.expires_at
          ? new Date(newSession.expires_at * 1000)
          : undefined,
        lineItems: {
          deleteMany: {},
          create: dto.lineItems.map((item) => ({
            priceId: pricesByStripeId.get(item.priceId)!.id,
            quantity: item.quantity,
          })),
        },
      },
    });

    return newSession;
  }

  async cancelCheckout(userId: string, checkoutSessionId: string) {
    const checkoutSession = await this.prismaService.checkoutSession.findFirst({
      where: {
        stripeCheckoutSessionId: checkoutSessionId,
        userId,
      },
    });

    if (!checkoutSession) {
      throw new NotFoundException(
        'Checkout session does not exist or user does not own it',
      );
    }
    await this.prismaService.checkoutSession.update({
      where: {
        stripeCheckoutSessionId: checkoutSession.stripeCheckoutSessionId,
      },
      data: {
        status: CheckoutSessionStatus.expired,
      },
    });
    return this.stripeService.client.checkout.sessions.expire(
      checkoutSession.stripeCheckoutSessionId,
    );
  }

  private toUnixTimestamp(value: string): number {
    const timestamp = Math.floor(new Date(value).getTime() / 1000);

    if (Number.isNaN(timestamp)) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }

    return timestamp;
  }
}
