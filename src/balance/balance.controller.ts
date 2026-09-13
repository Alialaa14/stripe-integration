import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BalanceService, DateIntervalInput } from './balance.service';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @UseGuards(IsAuthenticatedGuard)
  getBalance() {
    return this.balanceService.getBalance();
  }

  @Get('/transactions/:id')
  @UseGuards(IsAuthenticatedGuard)
  getBalanceTransaction(id: string) {
    return this.balanceService.getBalanceTransaction(id);
  }

  @Get('transactions')
  @UseGuards(IsAuthenticatedGuard)
  getBalanceTransactions(
    @Query() query: { limit: string; type: string; created: DateIntervalInput },
  ) {
    //todo : handle query.created shape and validation
    console.log(query.created);
    console.log(typeof query.created);
    return this.balanceService.getAllBalanceTransactions(
      Number(query.limit),
      query.type,
      query.created,
    );
  }
}
