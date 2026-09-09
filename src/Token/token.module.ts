import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';

@Module({
  controllers: [],
  providers: [
    {
      provide: 'accessToken',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<string>('ACCESS_TOKEN_SECRET_KEY'),
    },
    TokenService,
  ],
  exports: [TokenService],
  imports: [ConfigModule, JwtModule],
})
export class TokenModule {}
