import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(
    @Inject('accessToken') private readonly accessToken: string,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    console.log(this.accessToken);
  }

  async createAccessToken(payload: any) {
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET_KEY');
    const expiresIn = this.configService.get<number>('ACCESS_TOKEN_EXPIRY');
    return this.JwtService.sign(payload, { secret, expiresIn });
  }
  async createRefreshToken(payload: any) {
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET_KEY');
    const expiresIn = this.configService.get<number>('REFRESH_TOKEN_EXPIRY');
    return this.JwtService.sign(payload, { secret, expiresIn });
  }
  async verify(accessToken: string) {
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET_KEY');
    return this.JwtService.verify(accessToken, { secret });
  }
}
