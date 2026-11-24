import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLES_KEY } from './roles.decorator';
import { User } from '../../users/entities/user.entity';
import { getUserId } from './current-user';

@Injectable()
export class ActiveRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId = getUserId(req);
    if (!userId) throw new ForbiddenException('No user');

    const user = await this.userRepo.findOne({ where: { id: Number(userId) }, relations: ['memberships'] });
    if (!user) throw new ForbiddenException('User not found');

    const legacyRoles: string[] = user.role ?? [];
    if (user.isAdmin === true || legacyRoles.includes('President')) return true;

    const active = (user.memberships ?? []).find((m: any) => m.id === user.activeMembershipId);
    if (!active) throw new ForbiddenException('No active role');

    if (!required.includes(active.role)) {
      throw new ForbiddenException(
        `Requires role: ${required.join(' or ')} (you have ${active.role})`,
      );
    }
    return true;
  }
}
