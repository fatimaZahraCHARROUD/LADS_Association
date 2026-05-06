import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtCustomService } from './jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtCustomService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = this.jwtService.verify(token);

      // attach user to request
      request.user = payload;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}