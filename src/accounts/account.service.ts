import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_ACCOUNT_CONFIGURATION,
  DEFAULT_ACCOUNT_DEFAULTS,
  DEFAULT_ACCOUNT_IDENTITY,
  StripeAccountConfiguration,
  StripeAccountDashboard,
  StripeAccountDefaults,
  StripeAccountIdentity,
  StripeAccountResource,
  StripeAccountUpdateConfiguration,
  StripeAccountUpdateDefaults,
  StripeAccountUpdateIdentity,
} from './account.types';

// Dashboard Options
export type DashboardType = StripeAccountDashboard;

@Injectable()
export class AccountService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService,
  ) {}

  async createAccount(
    userId: string,
    name: string,
    email: string,
    phoneNumber: string,
    dashboard: DashboardType = 'full',
    configuration: StripeAccountConfiguration = {
      merchant: {},
    },
    defaults: StripeAccountDefaults = {
      currency: 'usd',
      locales: ['en-US'],
      responsibilities: {
        fees_collector: 'stripe',
        losses_collector: 'stripe',
      },
    },
    identity: StripeAccountIdentity = {
      entity_type: 'individual',
      country: 'US',
    },
  ) {
    const user = await this.getUserOrThrow(userId);
    const accountConfiguration = this.withAccountConfiguration(configuration);
    const accountDashboard = this.withAccountDashboard(
      dashboard,
      accountConfiguration,
    );
    const accountDefaults = this.withAccountDefaults(
      defaults,
      accountConfiguration,
    );
    const accountIdentity = this.withAccountIdentity(identity);
    const account = await this.stripeService.client.v2.core.accounts.create({
      contact_email: email,
      display_name: name,
      contact_phone: phoneNumber,
      dashboard: accountDashboard,
      defaults: accountDefaults,
      identity: accountIdentity,
      configuration: accountConfiguration,
    });

    if (!account) throw new Error('Account could not be created');
    await this.saveAccount(user.id, account);
    return account;
  }

  async updateAccount(
    userId: string,
    accountId: string,
    name: string,
    email: string,
    phoneNumber: string,
    dashboard: DashboardType = 'full',
    configuration?: StripeAccountUpdateConfiguration,
    defaults?: StripeAccountUpdateDefaults,
    identity?: StripeAccountUpdateIdentity,
  ) {
    const storedAccount = await this.getOwnedAccountOrThrow(userId, accountId);
    if (storedAccount.closed) {
      throw new ConflictException('Closed accounts cannot be updated');
    }
    const accountConfiguration = this.withAccountConfiguration(configuration);
    const accountDashboard = this.withAccountDashboard(
      dashboard,
      accountConfiguration,
    );
    const accountDefaults = this.withAccountDefaults(
      defaults,
      accountConfiguration,
    );
    const accountIdentity = this.withAccountIdentity(identity);
    const account = await this.stripeService.client.v2.core.accounts.update(
      accountId,
      {
        contact_email: email,
        display_name: name,
        contact_phone: phoneNumber,
        dashboard: accountDashboard,
        defaults: accountDefaults,
        identity: accountIdentity,
        configuration: accountConfiguration,
      },
    );
    await this.saveAccount(userId, account);
    return account;
  }

  async getAccount(userId: string, accountId: string) {
    await this.getOwnedAccountOrThrow(userId, accountId);
    const account = await this.stripeService.client.v2.core.accounts.retrieve(
      accountId,
      {
        include: ['configuration.customer', 'identity'],
      },
    );
    await this.saveAccount(userId, account);
    return account;
  }

  async getAllAccounts(
    userId: string,
    limit: number = 10,
    applied_configurations: ('customer' | 'merchant' | 'recipient')[] = [
      'customer',
    ],
    closed: boolean = false,
  ) {
    await this.getUserOrThrow(userId);
    const ownedAccounts = await this.prismaService.stripeAccount.findMany({
      where: { userId },
      select: { stripeAccountId: true },
    });
    const accountIds = new Set(
      ownedAccounts.map((account) => account.stripeAccountId),
    );
    const accounts = await this.stripeService.client.v2.core.accounts.list({
      limit,
      applied_configurations,
      closed,
    });
    return {
      ...accounts,
      data: accounts.data.filter((account) => accountIds.has(account.id)),
    };
  }

  async closeAccount(userId: string, accountId: string) {
    const storedAccount = await this.getOwnedAccountOrThrow(userId, accountId);
    if (storedAccount.closed) {
      throw new ConflictException('Account is already closed');
    }

    const getAccount =
      await this.stripeService.client.v2.core.accounts.retrieve(accountId);
    console.log(`apllied configurations ${getAccount.applied_configurations}`);
    const account = await this.stripeService.client.v2.core.accounts.close(
      accountId,
      {
        applied_configurations: getAccount.applied_configurations,
      },
    );
    await this.saveAccount(userId, account, true);
    return account;
  }

  async accountLink(accountId: string, userId: string) {
    // checks for the account
    const account = await this.getOwnedAccountOrThrow(userId, accountId);
    // Check if the account is closed or not
    if (account.closed) {
      throw new ConflictException('Account is already closed');
    }

    const accountLink =
      await this.stripeService.client.v2.core.accountLinks.create({
        account: accountId,
        use_case: {
          type: 'account_onboarding',
          account_onboarding: {
            configurations: account.appliedConfigurations,
            refresh_url: 'http://localhost:5000/refresh',
            return_url: 'http://localhost:5000/return',
          },
        },
      });

    return accountLink;
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User does not exist');
    return user;
  }

  private async getOwnedAccountOrThrow(userId: string, accountId: string) {
    const user = await this.getUserOrThrow(userId);
    const account = await this.prismaService.stripeAccount.findFirst({
      where: { stripeAccountId: accountId, userId },
    });

    if (!account) throw new NotFoundException('Account does not exist');
    return account;
  }

  private async saveAccount(
    userId: string,
    account: StripeAccountResource,
    closed = false,
  ) {
    return this.prismaService.stripeAccount.upsert({
      where: { stripeAccountId: account.id },
      create: {
        stripeAccountId: account.id,
        user: { connect: { id: userId } },
        displayName: account.display_name,
        contactEmail: account.contact_email,
        contactPhone: account.contact_phone,
        dashboard: account.dashboard,
        appliedConfigurations: account.applied_configurations,
        livemode: account.livemode,
        closed: closed || account.closed === true,
        closedAt: closed ? new Date() : null,
        configuration: this.toJson(account.configuration),
        defaults: this.toJson(account.defaults),
        identity: this.toJson(account.identity),
        requirements: this.toJson(account.requirements),
        metadata: this.toJson(account.metadata),
        raw: account as unknown as Prisma.InputJsonValue,
      },
      update: {
        displayName: account.display_name,
        contactEmail: account.contact_email,
        contactPhone: account.contact_phone,
        dashboard: account.dashboard,
        appliedConfigurations: account.applied_configurations,
        livemode: account.livemode,
        closed: closed || account.closed === true,
        closedAt: closed ? new Date() : undefined,
        configuration: this.toJson(account.configuration),
        defaults: this.toJson(account.defaults),
        identity: this.toJson(account.identity),
        requirements: this.toJson(account.requirements),
        metadata: this.toJson(account.metadata),
        raw: account as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    return value === undefined || value === null
      ? undefined
      : (value as Prisma.InputJsonValue);
  }

  private withAccountConfiguration(
    configuration?: StripeAccountConfiguration,
  ): StripeAccountConfiguration {
    return {
      ...DEFAULT_ACCOUNT_CONFIGURATION,
      ...configuration,
    };
  }

  private withAccountDashboard(
    dashboard: DashboardType,
    configuration: StripeAccountConfiguration,
  ): DashboardType {
    const requiresDashboard = Boolean(
      configuration.merchant || configuration.recipient,
    );

    if (requiresDashboard && dashboard === 'none') {
      throw new BadRequestException(
        'A full or express dashboard is required for merchant or recipient accounts',
      );
    }

    return dashboard;
  }

  private withAccountDefaults(
    defaults?: StripeAccountDefaults,
    configuration?: StripeAccountConfiguration,
  ): StripeAccountDefaults {
    const hasMerchantOrRecipient =
      !!configuration?.merchant || !!configuration?.recipient;

    const responsibilities = defaults?.responsibilities
      ? defaults.responsibilities
      : hasMerchantOrRecipient
        ? {
            fees_collector: 'stripe' as const,
            losses_collector: 'stripe' as const,
          }
        : undefined; // omit entirely for customer-only accounts

    return {
      ...DEFAULT_ACCOUNT_DEFAULTS,
      ...defaults,
      ...(responsibilities ? { responsibilities } : {}),
    };
  }
  private withAccountIdentity(
    identity?: StripeAccountIdentity,
  ): StripeAccountIdentity {
    return {
      ...DEFAULT_ACCOUNT_IDENTITY,
      ...identity,
    };
  }
}
