import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { StripeModule } from '../stripe/stripe.module';
import { TokenModule } from '../Token/token.module';

@Module({
  controllers: [AccountController],
  providers: [AccountService],
  exports: [],
  imports: [StripeModule, TokenModule],
})
export class AccountModule {}
