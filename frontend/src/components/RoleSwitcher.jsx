import { useState } from "react";
import { UserCog, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

const GLOBAL_ROLES = ["President", "Director Executive"];

function scopeLabel(m) {
  if (m.departmentId) {
    return typeof m.departmentId === "object"
      ? m.departmentId.name
      : "Department";
  }
  if (GLOBAL_ROLES.includes(m.role)) return "Global";
  return null;
}

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
const GLOBAL_ROLES = ["President", "Director Executive"];

const memberships = (user.memberships || []).filter(
  (m) => m.departmentId || GLOBAL_ROLES.includes(m.role),
);
  const activeId = user.activeMembershipId;

  if (memberships.length === 0) return null;

  const switchTo = async (id) => {
    setLoading(true);
    try {
      const res = await api.switchRole(id);

      // Update memberships with the fresh (populated) data from backend
      const updatedMemberships = memberships.map((m) =>
        String(m._id) === String(id) ? res.activeMembership : m
      );

      const u = {
        ...user,
        memberships: updatedMemberships,
        activeMembershipId: id,
      };
      localStorage.setItem("user", JSON.stringify(u));
      toast.success(`Switched to ${res.activeMembership.role}`);
      setOpen(false);

      const ROLE_ROUTES = {
        President: "/admin",
        "Director Executive": "/exec",
        "Team Manager": "/team",
        Responsable: "/responsible",
        Member: "/member",
      };
      const dest = ROLE_ROUTES[res.activeMembership.role] || "/login";
      window.location.href = dest;
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const active = memberships.find((m) => m._id === activeId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-sm hover:bg-gray-50"
      >
        <UserCog size={16} />
        {active ? `${active.role}` : "Select role"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="w-80 bg-white h-full shadow-xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-text">Switch role</h2>
              <button onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {memberships.map((m) => {
                const scope = scopeLabel(m);
                return (
                  <button
                    key={m._id}
                    disabled={loading}
                    onClick={() => switchTo(m._id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      m._id === activeId
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-brand-border hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{m.role}</div>
                    {scope && (
                      <div className="text-xs text-brand-muted mt-0.5">
                        {scope}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}