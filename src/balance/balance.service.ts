import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
export interface DateIntervalInput {
  gt?: Date;
  gte?: Date;
  lt?: Date;
  lte?: Date;
}
@Injectable()
export class BalanceService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService,
  ) {}

  async getBalance() {
    return await this.stripeService.client.balance.retrieve();
  }

  async getBalanceTransaction(id: string) {
    return await this.stripeService.client.balanceTransactions.retrieve(id);
  }

  async getAllBalanceTransactions(
    limit: number = 10,
    type: string = 'charge',
    created: DateIntervalInput,
  ) {
    const handledCreateed = this.handleCreated(
      JSON.parse(JSON.stringify(created)),
    );
    return await this.stripeService.client.balanceTransactions.list({
      limit,
      type,
      created: handledCreateed,
    });
  }

  private toUnixTimestamp(date: Date) {
    return Math.floor(date.getTime() / 1000);
  }
  private handleCreated(created?: DateIntervalInput) {
    if (!created) return undefined;

    return {
      ...(created.gt !== undefined && { gt: this.toUnixTimestamp(created.gt) }),
      ...(created.gte !== undefined && {
        gte: this.toUnixTimestamp(created.gte),
      }),
      ...(created.lt !== undefined && { lt: this.toUnixTimestamp(created.lt) }),
      ...(created.lte !== undefined && {
        lte: this.toUnixTimestamp(created.lte),
      }),
    };
  }
}
