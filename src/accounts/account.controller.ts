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
  @HttpCode(HttpStatus.CREATED)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.getAccount(user.sub, accountId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  async close(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.closeAccount(user.sub, accountId);
  }

  @Post(':accountId/link')
  @HttpCode(HttpStatus.CREATED)
  async accountLink(
    @CurrentUser() user: { sub: string },
    @Param('accountId') accountId: string,
  ) {
    return this.accountService.accountLink(accountId, user.sub);
  }
}
