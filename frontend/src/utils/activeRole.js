export function getEffectiveRole(user) {
  const roles = Array.isArray(user?.role) ? user.role : [];
  if (user?.isAdmin === true || roles.includes("President")) return "President";

  const memberships = Array.isArray(user?.memberships) ? user.memberships : [];
  const activeId = user?.activeMembershipId;

  let role = null;
  if (activeId != null) {
    const active = memberships.find(
      (membership) =>
        String(membership?._id ?? membership?.id) === String(activeId)
    );
    role = active?.role ?? null;
  }

  // Fallback si activeMembershipId n'est pas encore défini
  if (!role) {
    if (memberships.length > 0 && memberships[0]?.role) {
      role = memberships[0].role;
    } else if (roles.length > 0) {
      role = roles.find((r) => r !== "President") || roles[0];
    }
  }

  if (role === "Responsible") return "Responsable";
  return role || "Member";
}
