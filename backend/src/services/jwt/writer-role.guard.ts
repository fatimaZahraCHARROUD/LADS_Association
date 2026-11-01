import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { getUserId } from './current-user';
import { resolveAccess } from './effective-role';

@Injectable()
export class WriterRoleGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await this.usersService.findOne(getUserId(request));

    const access = resolveAccess(user);
    request.access = access; // reusable by controllers/services

    if (!access.canWrite) {
      throw new ForbiddenException(
        'Members cannot create, edit or delete this resource',
      );
    }
    return true;
  }
}
