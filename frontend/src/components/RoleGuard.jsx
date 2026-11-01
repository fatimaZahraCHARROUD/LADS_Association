import { Navigate } from "react-router-dom";
import { getEffectiveRole } from "../utils/activeRole";

const ROLE_ROUTES = {
  President: "/admin",
  "Director Executive": "/exec",
  "Team Manager": "/team",
  Responsable: "/responsible",
  Member: "/member",
};

export default function RoleGuard({ allow, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const activeRole = getEffectiveRole(user);
  if (!activeRole) return <Navigate to="/login" replace />;

  if (!allow.includes(activeRole)) {
    const fallback = ROLE_ROUTES[activeRole] || "/login";
    return <Navigate to={fallback} replace />;
  }

  return children;
}