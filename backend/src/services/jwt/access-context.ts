import { ForbiddenException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { EffectiveAccess, resolveAccess } from './effective-role';

export interface AccessContext {
  userId: string;
  access: EffectiveAccess;
  /** every department the user belongs to */
  memberDeptIds: Set<string>;
  /** departments the user can manage (write access) */
  managedDeptIds: Set<string>;
}

export async function loadAccessContext(
  userModel: Model<any>,
  departmentModel: Model<any>,
  userId: string,
): Promise<AccessContext> {
  const user: any = await userModel
    .findById(userId)
    .select('memberships activeMembershipId isAdmin role')
    .lean()
    .exec();
  if (!user) throw new ForbiddenException('User not found');

  const access = resolveAccess(user);
  const memberDeptIds = new Set<string>(access.departmentIds);
  const managedDeptIds = new Set<string>();

  (user.memberships ?? []).forEach((m: any) => {
    if (
      m.departmentId &&
      (m.role === 'Team Manager' || m.role === 'Responsable')
    ) {
      managedDeptIds.add(String(m.departmentId));
    }
  });

  if (Types.ObjectId.isValid(userId)) {
    const oid = new Types.ObjectId(userId);
    const depts: any[] = await departmentModel
      .find({
        $or: [
          { members: oid },
          { teamManagers: oid },
          { manager: oid },
          { viceManager: oid },
        ],
      })
      .select('_id teamManagers manager viceManager')
      .lean()
      .exec();

    depts.forEach((d) => {
      memberDeptIds.add(String(d._id));
      const manages =
        String(d.manager) === userId ||
        String(d.viceManager) === userId ||
        (d.teamManagers ?? []).some((t: any) => String(t) === userId);
      if (manages) managedDeptIds.add(String(d._id));
    });
  }

  return { userId, access, memberDeptIds, managedDeptIds };
}
