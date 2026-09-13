import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { UpdatePaymentIntentDto } from './dto/update-payment-intent.dto';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentIntent } from 'stripe';
import { PaymentIntentParamDto } from './dto/paymentIntentId.dto';
import { ListPaymentIntentsDto } from './dto/list-payment-intents.dto';
import { doesNotThrow } from 'assert';
import { CancelPaymentIntentDto } from './dto/cancel-payment-intent.dto';
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(IsAuthenticatedGuard)
  async createPaymentIntent(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return await this.paymentService.createPaymentIntent(user.sub, dto);
  }

  @Patch('/:paymentIntentId')
  @UseGuards(IsAuthenticatedGuard)
  async updatePaymentIntent(
    @Param('paymentIntentId') paymentIntentId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdatePaymentIntentDto,
  ) {
    return await this.paymentService.updatePaymentIntent(
      paymentIntentId,
      user.sub,
      dto,
    );
  }

  @Get()
  @UseGuards(IsAuthenticatedGuard)
  async listPaymentIntents(
    @CurrentUser() user: { sub: string },
    @Query() query: ListPaymentIntentsDto,
  ) {
    return await this.paymentService.listPaymentIntents(user.sub, query);
  }

  @Get('/:paymentIntentId')
  @UseGuards(IsAuthenticatedGuard)
  async retrievePaymentIntent(
    @Param() dto: PaymentIntentParamDto,
    @CurrentUser() user: { sub: string },
  ) {
    return await this.paymentService.retievePaymentIntent(
      user.sub,
      dto.paymentIntentId,
    );
  }

  @Post('/:paymentIntentId/cancel')
  @UseGuards(IsAuthenticatedGuard)
  async cancelPaymentIntent(
    @Param() dto: PaymentIntentParamDto,
    @CurrentUser() user: { sub: string },
    @Body() cancel: CancelPaymentIntentDto,
  ) {
    return await this.paymentService.cancelPaymentIntent(
      user.sub,
      dto.paymentIntentId,
      cancel,
    );
  }
}
