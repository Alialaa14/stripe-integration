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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsAuthenticatedGuard } from '../common/guards/isAuthenticated';
import { AccountService } from './account.service';
import { CloseAccountDto } from './dto/close-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('/accounts')
@UseGuards(IsAuthenticatedGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateAccountDto) {
    return this.accountService.createAccount(
      user.sub,
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
  update(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateAccount(
      user.sub,
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
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.getAccount(user.sub, accountId);
  }

  @Get()
  findAll(
    @CurrentUser() user: { sub: string },
    @Query() query: ListAccountsDto,
  ) {
    return this.accountService.getAllAccounts(
      user.sub,
      query.limit === undefined ? undefined : Number(query.limit),
      query.appliedConfigurations ?? ['customer'],
      query.closed === undefined ? undefined : query.closed === 'true',
    );
  }

  @Delete(':accountId')
  async close(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.closeAccount(user.sub, accountId);
  }

  @Post(':accountId/link')
  async accountLink(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.accountLink(accountId, user.sub);
  }
}
