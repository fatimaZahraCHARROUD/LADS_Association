import { Navigate } from "react-router-dom";

const ROLE_ROUTES = {
  President: "/admin",
  "Director Executive": "/exec",
  "Team Manager": "/team",
  Responsable: "/responsible",
  Member: "/member",
};

export default function RoleGuard({ allow, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const memberships = user.memberships || [];
  const active = memberships.find((m) => m._id === user.activeMembershipId);

  const isAdminBypass =
    user.isAdmin === true ||
    (user.role || []).includes("President");

  if (isAdminBypass && allow.includes("President")) {
    return children;
  }
  if (!active) return <Navigate to="/login" replace />;

  if (!allow.includes(active.role)) {
    const fallback = ROLE_ROUTES[active.role] || "/login";
    return <Navigate to={fallback} replace />;
  }

  return children;
}