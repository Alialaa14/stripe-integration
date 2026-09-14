import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { TokenModule } from '../Token/token.module';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
  imports: [PrismaModule, StripeModule, TokenModule],
})
export class CustomerModule {}
