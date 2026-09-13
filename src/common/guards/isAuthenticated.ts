import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../../Token/token.service';

@Injectable()
export class IsAuthenticatedGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authorization = req.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      req.user = await this.tokenService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }
}
