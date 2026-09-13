import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { Prisma } from '../generated/prisma/client';
import { SetupIntentStatus, SetupIntentUsage } from '../generated/prisma/enums';
import { CustomerService } from '../customer/customer.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateSetupIntentDto } from './dto/create-setup-intent.dto';
import { ListSetupIntentsDto } from './dto/list-setup-intents.dto';
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto';

const setupIntentStatuses = new Set<string>(Object.values(SetupIntentStatus));
const setupIntentUsages = new Set<string>(Object.values(SetupIntentUsage));

@Injectable()
export class SetupIntentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly customerService: CustomerService,
  ) {}

  async createSetupIntent(userId: string, dto: CreateSetupIntentDto) {
    const customer = await this.customerService.createOrGetCustomer(userId);
    const setupIntent = await this.stripe.client.setupIntents.create({
      customer: customer.stripeCustomerId,
      ...(dto.paymentMethod !== undefined && {
        payment_method: dto.paymentMethod,
      }),
      ...(dto.usage !== undefined && { usage: dto.usage }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata }),
    });

    return this.saveSetupIntent(userId, customer.id, setupIntent);
  }

  async getSetupIntent(userId: string, setupIntentId: string) {
    const storedSetupIntent = await this.getOwnedSetupIntent(
      userId,
      setupIntentId,
    );
    const setupIntent = await this.stripe.client.setupIntents.retrieve(
      storedSetupIntent.stripeSetupIntentId,
    );

    return this.saveSetupIntent(
      userId,
      storedSetupIntent.customerId,
      setupIntent,
    );
  }

  async listSetupIntents(userId: string, dto: ListSetupIntentsDto) {
    const customer = await this.customerService.createOrGetCustomer(userId);
    const created = {
      ...(dto.createdGte && { gte: this.toUnixTimestamp(dto.createdGte) }),
      ...(dto.createdLte && { lte: this.toUnixTimestamp(dto.createdLte) }),
    };
    const setupIntents = await this.stripe.client.setupIntents.list({
      customer: customer.stripeCustomerId,
      ...(dto.limit !== undefined && { limit: dto.limit }),
      ...(dto.startingAfter !== undefined && {
        starting_after: dto.startingAfter,
      }),
      ...(dto.endingBefore !== undefined && {
        ending_before: dto.endingBefore,
      }),
      ...(Object.keys(created).length > 0 && { created }),
    });

    await Promise.all(
      setupIntents.data.map((setupIntent) =>
        this.saveSetupIntent(userId, customer.id, setupIntent),
      ),
    );

    return setupIntents;
  }

  async updateSetupIntent(
    userId: string,
    setupIntentId: string,
    dto: UpdateSetupIntentDto,
  ) {
    const storedSetupIntent = await this.getOwnedSetupIntent(
      userId,
      setupIntentId,
    );
    const setupIntent = await this.stripe.client.setupIntents.update(
      storedSetupIntent.stripeSetupIntentId,
      {
        ...(dto.paymentMethod !== undefined && {
          payment_method: dto.paymentMethod,
        }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    );

    return this.saveSetupIntent(
      userId,
      storedSetupIntent.customerId,
      setupIntent,
    );
  }

  async cancelSetupIntent(userId: string, setupIntentId: string) {
    const storedSetupIntent = await this.getOwnedSetupIntent(
      userId,
      setupIntentId,
    );
    const setupIntent = await this.stripe.client.setupIntents.cancel(
      storedSetupIntent.stripeSetupIntentId,
    );

    return this.saveSetupIntent(
      userId,
      storedSetupIntent.customerId,
      setupIntent,
    );
  }

  private async getOwnedSetupIntent(userId: string, setupIntentId: string) {
    const setupIntent = await this.prisma.setupIntent.findFirst({
      where: {
        userId,
        stripeSetupIntentId: setupIntentId,
      },
    });

    if (!setupIntent) {
      throw new NotFoundException(
        'Setup intent does not exist or user does not own it',
      );
    }

    return setupIntent;
  }

  private async saveSetupIntent(
    userId: string,
    customerId: string | null,
    setupIntent: Stripe.SetupIntent,
  ) {
    const status = this.toStatus(setupIntent.status);
    const usage = this.toUsage(setupIntent.usage);

    return this.prisma.setupIntent.upsert({
      where: { stripeSetupIntentId: setupIntent.id },
      create: {
        stripeSetupIntentId: setupIntent.id,
        userId,
        customerId,
        paymentMethodId: this.getPaymentMethodId(setupIntent.payment_method),
        status,
        usage,
        description: setupIntent.description,
        cancellationReason: setupIntent.cancellation_reason,
        failureCode: setupIntent.last_setup_error?.code ?? null,
        failureMessage: setupIntent.last_setup_error?.message ?? null,
        metadata: setupIntent.metadata as Prisma.InputJsonValue,
      },
      update: {
        customerId,
        paymentMethodId: this.getPaymentMethodId(setupIntent.payment_method),
        status,
        usage,
        description: setupIntent.description,
        cancellationReason: setupIntent.cancellation_reason,
        failureCode: setupIntent.last_setup_error?.code ?? null,
        failureMessage: setupIntent.last_setup_error?.message ?? null,
        metadata: setupIntent.metadata as Prisma.InputJsonValue,
      },
    });
  }

  private getPaymentMethodId(
    paymentMethod: string | Stripe.PaymentMethod | null,
  ): string | null {
    return typeof paymentMethod === 'string' ? paymentMethod : null;
  }

  private toStatus(status: string): SetupIntentStatus {
    if (!setupIntentStatuses.has(status)) {
      throw new Error(`Unsupported Stripe SetupIntent status: ${status}`);
    }

    return status as SetupIntentStatus;
  }

  private toUsage(usage: string | null): SetupIntentUsage {
    if (!usage || !setupIntentUsages.has(usage)) {
      return SetupIntentUsage.off_session;
    }

    return usage as SetupIntentUsage;
  }

  private toUnixTimestamp(value: string): number {
    const timestamp = Math.floor(new Date(value).getTime() / 1000);
    if (Number.isNaN(timestamp)) {
      throw new Error(`Invalid date: ${value}`);
    }

    return timestamp;
  }
}
