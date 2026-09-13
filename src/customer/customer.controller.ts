import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(IsAuthenticatedGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: { sub: string }) {
    return this.customerService.createCustomer(user.sub);
  }

  @Get(':customerId')
  @HttpCode(HttpStatus.OK)
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('customerId') customerId: string,
  ) {
    return this.customerService.getCustomerById(user.sub, customerId);
  }

  @Patch(':customerId')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: { sub: string },
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(user.sub, customerId, dto);
  }

  @Delete(':customerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { sub: string },
    @Param('customerId') customerId: string,
  ) {
    await this.customerService.deleteCustomer(user.sub, customerId);
  }
}
