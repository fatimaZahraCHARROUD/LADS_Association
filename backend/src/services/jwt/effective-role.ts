export type EffectiveRole =
  | 'admin'
  | 'exec'
  | 'team_manager'
  | 'responsable'
  | 'member';

const RANK: EffectiveRole[] = [
  'member',
  'responsable',
  'team_manager',
  'exec',
  'admin',
];

// New system: memberships[].role
const MEMBERSHIP_ROLE: Record<string, EffectiveRole> = {
  President: 'admin',
  'Director Executive': 'exec',
  'Team Manager': 'team_manager',
  Responsable: 'responsable',
  Member: 'member',
};

// Legacy system: user.role[]
const LEGACY_ROLE: Record<string, EffectiveRole> = {
  President: 'admin',
  'Director Executive': 'exec',
  Manager: 'team_manager',
  'Team Manager': 'team_manager',
  Responsible: 'responsable',
  Responsable: 'responsable',
  Member: 'member',
};

export interface EffectiveAccess {
  role: EffectiveRole;
  /** every department the user belongs to (any membership) */
  departmentIds: string[];
  /** department of the currently active membership */
  activeDepartmentId: string | null;
  canWrite: boolean;
  canSeeAllLinks: boolean;
}

export function resolveAccess(user: any): EffectiveAccess {
  const memberships: any[] = user?.memberships ?? [];
  const legacy: string[] = user?.role ?? [];

  const departmentIds = [
    ...new Set(
      memberships
        .map((m) => m.departmentId)
        .filter(Boolean)
        .map((d) => String(d)),
    ),
  ];

  const active = memberships.find(
    (m) => String(m._id) === String(user?.activeMembershipId),
  );

  let role: EffectiveRole;
  if (user?.isAdmin === true || legacy.includes('President')) {
    role = 'admin';
  } else if (active) {
    role = MEMBERSHIP_ROLE[active.role] ?? 'member';
  } else {
    // no active membership: fall back to the highest legacy role
    role = legacy
      .map((r) => LEGACY_ROLE[r] ?? 'member')
      .reduce<EffectiveRole>(
        (best, r) => (RANK.indexOf(r) > RANK.indexOf(best) ? r : best),
        'member',
      );
  }

  return {
    role,
    departmentIds,
    activeDepartmentId: active?.departmentId ? String(active.departmentId) : null,
    canWrite: role !== 'member',
    canSeeAllLinks: role === 'admin' || role === 'exec',
  };
}
