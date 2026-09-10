import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';

@Module({
  controllers: [],
  providers: [TokenService],
  exports: [TokenService],
  imports: [ConfigModule, JwtModule],
})
export class TokenModule {}
