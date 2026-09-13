import { Module } from '@nestjs/common';
import { TokenModule } from '../Token/token.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [TokenModule],
})
export class AuthModule {}
