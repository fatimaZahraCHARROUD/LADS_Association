import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { getUserId } from './current-user';

const WRITER_ROLES = ['President', 'Manager', 'Responsible'];

@Injectable()
export class WriterRoleGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await this.usersService.findOne(getUserId(request));

    const canWrite = (user.role ?? []).some((r: string) =>
      WRITER_ROLES.includes(r),
    );
    if (!canWrite) {
      throw new ForbiddenException(
        'Members cannot create, edit or delete this resource',
      );
    }
    return true;
  }
}
