import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { StripeModule } from './stripe/stripe.module';
import { TokenModule } from './Token/token.module';
import { AccountModule } from './accounts/account.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BalanceModule } from './balance/balance.module';
import { PaymentModule } from './payment/payment.module';
import { CheckoutModule } from './checkout/checkout.module';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TokenModule,
    PrismaModule,
    AuthModule,
    StripeModule,
    AccountModule,
    BalanceModule,
    PaymentModule,
    CheckoutModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
