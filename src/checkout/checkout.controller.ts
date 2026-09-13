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
import { CheckoutService } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { ListCheckoutSessionsDto } from './dto/list-checkout-sessions.dto';
import {
  CheckoutSessionParamDto,
  UpdateCheckoutSessionDto,
  UpdateCheckoutSessionParam,
} from './dto/update-checkout-session.dto';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UseGuards(IsAuthenticatedGuard)
  async createCheckoutSession(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkoutService.createCheckoutSession(user.sub, dto);
  }

  @Get()
  @UseGuards(IsAuthenticatedGuard)
  async listCheckoutSessions(
    @CurrentUser() user: { sub: string },
    @Query() query: ListCheckoutSessionsDto,
  ) {
    return this.checkoutService.listCheckoutSessions(user.sub, query);
  }

  @Get('/:id')
  @UseGuards(IsAuthenticatedGuard)
  async retrieveCheckoutSession(
    @Param() params: CheckoutSessionParamDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.checkoutService.retrieveCheckoutSession(user.sub, params.id);
  }

  @Patch('/:id')
  @UseGuards(IsAuthenticatedGuard)
  async updateCheckoutSession(
    @Param() params: UpdateCheckoutSessionParam,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateCheckoutSessionDto,
  ) {
    return this.checkoutService.updateCheckoutSession(user.sub, params.id, dto);
  }
}
