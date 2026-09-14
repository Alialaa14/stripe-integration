import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TokenModule } from '../Token/token.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { CustomerModule } from '../customer/customer.module';
@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [],
  imports: [TokenModule, PrismaModule, StripeModule, CustomerModule],
})
export class PaymentModule {}
