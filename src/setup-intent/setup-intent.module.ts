import { Module } from '@nestjs/common';
import { CustomerModule } from '../customer/customer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { SetupIntentController } from './setup-intent.controller';
import { SetupIntentService } from './setup-intent.service';
import { TokenModule } from '../Token/token.module';

@Module({
  controllers: [SetupIntentController],
  providers: [SetupIntentService],
  exports: [SetupIntentService],
  imports: [PrismaModule, StripeModule, CustomerModule, TokenModule],
})
export class SetupIntentModule {}
