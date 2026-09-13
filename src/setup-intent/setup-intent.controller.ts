import {
  Body,
  Controller,
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
import { CreateSetupIntentDto } from './dto/create-setup-intent.dto';
import { ListSetupIntentsDto } from './dto/list-setup-intents.dto';
import { UpdateSetupIntentDto } from './dto/update-setup-intent.dto';
import { SetupIntentService } from './setup-intent.service';

@Controller('setup-intents')
@UseGuards(IsAuthenticatedGuard)
export class SetupIntentController {
  constructor(private readonly setupIntentService: SetupIntentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateSetupIntentDto,
  ) {
    return this.setupIntentService.createSetupIntent(user.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  list(
    @CurrentUser() user: { sub: string },
    @Query() dto: ListSetupIntentsDto,
  ) {
    return this.setupIntentService.listSetupIntents(user.sub, dto);
  }

  @Get(':setupIntentId')
  @HttpCode(HttpStatus.OK)
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('setupIntentId') setupIntentId: string,
  ) {
    return this.setupIntentService.getSetupIntent(user.sub, setupIntentId);
  }

  @Patch(':setupIntentId')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: { sub: string },
    @Param('setupIntentId') setupIntentId: string,
    @Body() dto: UpdateSetupIntentDto,
  ) {
    return this.setupIntentService.updateSetupIntent(
      user.sub,
      setupIntentId,
      dto,
    );
  }

  @Post(':setupIntentId/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: { sub: string },
    @Param('setupIntentId') setupIntentId: string,
  ) {
    return this.setupIntentService.cancelSetupIntent(user.sub, setupIntentId);
  }
}
