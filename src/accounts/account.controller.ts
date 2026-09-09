import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';
import { AccountService } from './account.service';
import { CloseAccountDto } from './dto/close-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('/accounts')
// @UseGuards(IsAuthenticatedGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountService.createAccount(
      dto.name,
      dto.email,
      dto.phoneNumber,
      dto.dashboard,
      dto.configuration,
      dto.defaults,
      dto.identity,
    );
  }

  @Patch(':accountId')
  update(@Param('accountId') accountId: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.updateAccount(
      accountId,
      dto.name,
      dto.email,
      dto.phoneNumber,
      dto.dashboard,
      dto.configuration,
      dto.defaults,
      dto.identity,
    );
  }

  @Get(':accountId')
  findOne(@Param('accountId') accountId: string) {
    return this.accountService.getAccount(accountId);
  }

  @Get()
  findAll(@Query() query: ListAccountsDto) {
    return this.accountService.getAllAccounts(
      query.limit === undefined ? undefined : Number(query.limit),
      query.appliedConfigurations ?? ['customer'],
      query.closed === undefined ? undefined : query.closed === 'true',
    );
  }

  @Delete(':accountId')
  close(@Param('accountId') accountId: string, @Body() dto: CloseAccountDto) {
    return this.accountService.closeAccount(
      accountId,
      dto.appliedConfigurations,
    );
  }
}
