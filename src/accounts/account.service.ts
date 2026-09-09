import { Injectable } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
// Dashboard Options
export enum DashboardType {
  express = 'express',
  full = 'full',
  none = 'none',
}
@Injectable()
export class AccountService {
  constructor(private readonly stripeService: StripeService) {}

  async createAccount(
    name: string,
    email: string,
    phoneNumber: string,
    dashboard: DashboardType,
    configuration?: Record<string, unknown>,
    defaults?: Record<string, unknown>,
    identity?: Record<string, unknown>,
  ) {
    return this.stripeService.client.v2.core.accounts.create({
      contact_email: email,
      display_name: name,
      contact_phone: phoneNumber,
      dashboard: dashboard,
      defaults,
      identity,
      configuration,
    });
  }

  async updateAccount(
    accountId: string,
    name: string,
    email: string,
    phoneNumber: string,
    dashboard: DashboardType,
    configuration?: Record<string, unknown>,
    defaults?: Record<string, unknown>,
    identity?: Record<string, unknown>,
  ) {
    return this.stripeService.client.v2.core.accounts.update(accountId, {
      contact_email: email,
      display_name: name,
      contact_phone: phoneNumber,
      dashboard: dashboard,
      defaults,
      identity,
      configuration,
    });
  }

  async getAccount(accountId: string) {
    return this.stripeService.client.v2.core.accounts.retrieve(accountId, {
      include: ['configuration.customer', 'identity'],
    });
  }

  async getAllAccounts(
    limit: number = 10,
    applied_configurations: ('customer' | 'merchant' | 'recipient')[] = [
      'customer',
    ],
    closed: boolean = false,
  ) {
    return this.stripeService.client.v2.core.accounts.list({
      limit,
      applied_configurations,
      closed,
    });
  }

  async closeAccount(
    accountId: string,
    applied_configurations: ('customer' | 'merchant' | 'recipient')[],
  ) {
    return this.stripeService.client.v2.core.accounts.close(accountId, {
      applied_configurations,
    });
  }
}
