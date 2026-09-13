import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TokenModule } from '../Token/token.module';
@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [],
  imports: [TokenModule],
})
export class PaymentModule {}
