import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ROLES_KEY } from './roles.decorator';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { getUserId } from './current-user';

@Injectable()
export class ActiveRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    const user = await this.userModel
      .findById(userId)
      .select('memberships activeMembershipId isAdmin role')
      .lean()
      .exec();
    if (!user) throw new ForbiddenException('User not found');

    // Admin bypass (President or isAdmin flag)
    const legacyRoles: string[] = user.role ?? [];
    if (user.isAdmin === true || legacyRoles.includes('President')) {
      return true;
    }

    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    if (!active) throw new ForbiddenException('No active role');

    if (!required.includes(active.role)) {
      throw new ForbiddenException(
        `Requires role: ${required.join(' or ')} (you have ${active.role})`,
      );
    }
    return true;
  }
}