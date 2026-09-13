import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { StripeModule } from '../stripe/stripe.module';
import { TokenModule } from '../Token/token.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
  imports: [StripeModule, TokenModule, PrismaModule],
})
export class BalanceModule {}
