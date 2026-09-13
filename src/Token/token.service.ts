import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createAccessToken(payload: Record<string, unknown>) {
    return this.jwtService.signAsync(payload, {
      secret: this.getRequiredConfig('ACCESS_TOKEN_SECRET_KEY'),
      expiresIn: this.getExpiry('ACCESS_TOKEN_EXPIRY', '15m'),
    });
  }

  createRefreshToken(payload: Record<string, unknown>) {
    return this.jwtService.signAsync(payload, {
      secret: this.getRequiredConfig('REFRESH_TOKEN_SECRET_KEY'),
      expiresIn: this.getExpiry('REFRESH_TOKEN_EXPIRY', '7d'),
    });
  }

  verify(accessToken: string) {
    return this.jwtService.verifyAsync<{ sub: string; email: string }>(
      accessToken,
      { secret: this.getRequiredConfig('ACCESS_TOKEN_SECRET_KEY') },
    );
  }

  verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verifyAsync<{ sub: string; email: string }>(
      refreshToken,
      { secret: this.getRequiredConfig('REFRESH_TOKEN_SECRET_KEY') },
    );
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`${key} is required`);
    return value;
  }

  private getExpiry(
    key: string,
    fallback: string,
  ): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>(key) ??
      fallback) as JwtSignOptions['expiresIn'];
  }
}
