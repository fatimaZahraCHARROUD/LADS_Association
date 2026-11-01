import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { getUserId } from '../services/jwt/current-user';

@Injectable()
export class DepartmentsAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { userId?: string; sub?: string } }>();
    const user = await this.usersService.findOne(getUserId(request));

    if (!user.role.includes('President')) {
      throw new ForbiddenException('Only Presidents can manage departments');
    }

    return true;
  }
}
