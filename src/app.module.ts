import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { StripeModule } from './stripe/stripe.module';
import { TokenModule } from './Token/token.module';
import { AccountModule } from './accounts/account.module';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TokenModule,
    StripeModule,
    AccountModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
