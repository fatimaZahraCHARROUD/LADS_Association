// Same rules as backend/src/services/jwt/effective-role.ts
export function getAccess() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const active = (user.memberships || []).find(
    (m) => String(m._id) === String(user.activeMembershipId)
  );
  const isAdmin = user.isAdmin === true || (user.role || []).includes("President");
  const role = isAdmin ? "President" : active?.role || "Member";

  return {
    role,
    canWrite: role !== "Member",
    isGlobal: role === "President" || role === "Director Executive",
    activeDepartmentId: active?.departmentId || null,
  };
}
