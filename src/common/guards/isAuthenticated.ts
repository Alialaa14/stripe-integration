import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from '../../Token/token.service';

@Injectable()
export class IsAuthenticatedGuard implements CanActivate {
  constructor(private readonly TokenService: TokenService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    // Get Acess Token from Header or Cookie
    const token =
      (req.headers.authorization && req.headers.authorization.split(' ')[1]) ||
      req.cookies['accessToken'];
    if (!token) {
      return false;
    }
    // verify access token
    const user = this.TokenService.verify(token);
    req.user = user;
    return true;
  }
}
