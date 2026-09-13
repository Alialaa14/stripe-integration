import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { TokenModule } from '../Token/token.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [],
  imports: [TokenModule, PrismaModule, StripeModule, CustomerModule],
})
export class CheckoutModule {}
