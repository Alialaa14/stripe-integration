import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async createCustomer(userId: string) {
    const existingCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });
    if (existingCustomer) {
      throw new ConflictException('Customer already exists');
    }

    return this.createOrGetCustomer(userId);
  }

  async createOrGetCustomer(userId: string) {
    const user = await this.getUserOrThrow(userId);
    const existingCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (existingCustomer) return existingCustomer;

    const customer = await this.stripe.client.customers.create(
      {
        email: user.email,
        ...(user.name && { name: user.name }),
        metadata: { userId },
      },
      this.stripe.withIdempotencyKey(`customer-${userId}`),
    );

    return this.saveCustomer(userId, customer);
  }

  async getCustomer(userId: string) {
    const storedCustomer = await this.getStoredCustomerOrThrow(userId);

    return this.syncCustomer(userId, storedCustomer.stripeCustomerId);
  }

  async getCustomerById(userId: string, customerId: string) {
    const storedCustomer = await this.getStoredCustomerOrThrow(
      userId,
      customerId,
    );

    return this.syncCustomer(userId, storedCustomer.stripeCustomerId);
  }

  private async syncCustomer(userId: string, stripeCustomerId: string) {
    const customer =
      await this.stripe.client.customers.retrieve(stripeCustomerId);
    if (customer.deleted) {
      throw new NotFoundException('Stripe customer has been deleted');
    }

    return this.saveCustomer(userId, customer);
  }

  async updateCustomer(
    userId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    const storedCustomer = await this.getStoredCustomerOrThrow(
      userId,
      customerId,
    );
    const customer = await this.stripe.client.customers.update(
      storedCustomer.stripeCustomerId,
      {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    );

    return this.saveCustomer(userId, customer);
  }

  async deleteCustomer(userId: string, customerId: string) {
    const storedCustomer = await this.getStoredCustomerOrThrow(
      userId,
      customerId,
    );
    const deletedCustomer = await this.stripe.client.customers.del(
      storedCustomer.stripeCustomerId,
    );

    await this.prisma.$transaction([
      this.prisma.stripeCustomer.delete({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: null },
      }),
    ]);

    return deletedCustomer;
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User does not exist');
    return user;
  }

  private async getStoredCustomerOrThrow(userId: string, customerId?: string) {
    const customer = await this.prisma.stripeCustomer.findFirst({
      where: {
        userId,
        ...(customerId && { id: customerId }),
      },
    });
    if (!customer) throw new NotFoundException('Customer does not exist');
    return customer;
  }

  private async saveCustomer(userId: string, customer: Stripe.Customer) {
    return this.prisma.$transaction(async (transaction) => {
      const savedCustomer = await transaction.stripeCustomer.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customer.id,
          email: customer.email,
          name: customer.name,
          currency: customer.currency,
          defaultPaymentMethodId: this.getPaymentMethodId(
            customer.invoice_settings.default_payment_method,
          ),
        },
        update: {
          stripeCustomerId: customer.id,
          email: customer.email,
          name: customer.name,
          currency: customer.currency,
          defaultPaymentMethodId: this.getPaymentMethodId(
            customer.invoice_settings.default_payment_method,
          ),
        },
      });

      await transaction.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      return savedCustomer;
    });
  }

  private getPaymentMethodId(
    paymentMethod: string | Stripe.PaymentMethod | null,
  ): string | null {
    return typeof paymentMethod === 'string' ? paymentMethod : null;
  }
}
