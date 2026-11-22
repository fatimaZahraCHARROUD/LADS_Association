export function getEffectiveRole(user) {
  const roles = Array.isArray(user?.role) ? user.role : [];
  if (user?.isAdmin === true || roles.includes("President")) return "President";

  const memberships = Array.isArray(user?.memberships) ? user.memberships : [];
  const activeId = user?.activeMembershipId;
  if (activeId == null) return null;

  const active = memberships.find(
    (membership) =>
      String(membership?._id ?? membership?.id) === String(activeId)
  );

  return active?.role ?? null;
}