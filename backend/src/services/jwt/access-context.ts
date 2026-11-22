import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
  userRepo: Repository<any>,
  departmentRepo: Repository<any>,
  userId: string,
): Promise<AccessContext> {
  const user = await userRepo.findOne({
    where: { id: Number(userId) },
    relations: ['memberships'],
  });
  if (!user) throw new ForbiddenException('User not found');

  const access: EffectiveAccess = resolveAccess(user);
  const memberDeptIds = new Set<string>(access.departmentIds);
  const managedDeptIds = new Set<string>();

  (user.memberships ?? []).forEach((m: any) => {
    if (m.departmentId && (m.role === 'Team Manager' || m.role === 'Responsable')) {
      managedDeptIds.add(String(m.departmentId));
    }
  });

  const numId = Number(userId);
  if (!isNaN(numId)) {
    const depts = await departmentRepo
      .createQueryBuilder('d')
      .where(
        `JSON_CONTAINS(d.members, :uid) OR JSON_CONTAINS(d.team_managers, :uid) OR d.manager = :nid OR d.vice_manager = :nid`,
        { uid: JSON.stringify(numId), nid: numId },
      )
      .select(['d.id', 'd.teamManagers', 'd.manager', 'd.viceManager'])
      .getMany();

    depts.forEach((d: any) => {
      memberDeptIds.add(String(d.id));
      const manages =
        d.manager === numId ||
        d.viceManager === numId ||
        (d.teamManagers ?? []).includes(numId);
      if (manages) managedDeptIds.add(String(d.id));
    });
  }

  return { userId, access, memberDeptIds, managedDeptIds };
}
