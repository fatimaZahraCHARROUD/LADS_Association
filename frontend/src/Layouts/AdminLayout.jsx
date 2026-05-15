import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Calendar,
  Activity,
  Newspaper,
  GraduationCap,
  Mail,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ClipboardList,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [cmsOpen, setCmsOpen] = useState(true);
  const [msgOpen, setMsgOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const widthCls = collapsed ? "w-[72px]" : "w-64";

  return (
    <div className="flex h-screen bg-brand-bg">
      {/* SIDEBAR */}
      <aside
        className={`${widthCls} bg-brand-primary text-white flex flex-col transition-[width] duration-200 ease-in-out shrink-0`}
      >
        {/* TOP */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {!collapsed && (
            <h2 className="text-lg font-bold tracking-wide">LADS Admin</h2>
          )}
          <button
            className="p-1.5 rounded-md text-white/80 hover:bg-white/10 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <SidebarLink to="/admin" end icon={LayoutDashboard} collapsed={collapsed}>
            Dashboard
          </SidebarLink>

          <SidebarGroup
            label="Content"
            icon={Database}
            collapsed={collapsed}
            open={cmsOpen}
            onToggle={() => {
              if (collapsed) setCollapsed(false);
              setCmsOpen((o) => !o);
            }}
          >
            <SidebarLink to="/admin/events" icon={Calendar} collapsed={collapsed} nested>
              Events
            </SidebarLink>
            <SidebarLink to="/admin/activities" icon={Activity} collapsed={collapsed} nested>
              Activities
            </SidebarLink>
            <SidebarLink to="/admin/news" icon={Newspaper} collapsed={collapsed} nested>
              News
            </SidebarLink>
            <SidebarLink to="/admin/formations" icon={GraduationCap} collapsed={collapsed} nested>
              Formations
            </SidebarLink>
            <SidebarLink to="/admin/info" icon={Settings} collapsed={collapsed} nested>
              LADS Info
            </SidebarLink>
          </SidebarGroup>

          <SidebarGroup
            label="Inbox"
            icon={MessageSquare}
            collapsed={collapsed}
            open={msgOpen}
            onToggle={() => {
              if (collapsed) setCollapsed(false);
              setMsgOpen((o) => !o);
            }}
          >
            <SidebarLink to="/admin/contacts" icon={Mail} collapsed={collapsed} nested>
              Contacts
            </SidebarLink>
            <SidebarLink to="/admin/membership" icon={Users} collapsed={collapsed} nested>
              Membership
            </SidebarLink>
            <SidebarLink to="/admin/eventRegister" icon={ClipboardList} collapsed={collapsed} nested>
              Registrations
            </SidebarLink>
          </SidebarGroup>
        </nav>

        {/* LOGOUT */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-200 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, end, icon: Icon, collapsed, nested, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          nested ? "ml-2 text-white/80" : "text-white/90"
        } ${
          isActive
            ? "bg-white/15 text-white font-medium"
            : "hover:bg-white/10"
        }`
      }
      title={collapsed ? String(children) : undefined}
    >
      <Icon size={nested ? 16 : 18} />
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}

function SidebarGroup({ label, icon: Icon, open, onToggle, collapsed, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10 transition-colors"
        title={collapsed ? label : undefined}
      >
        <Icon size={18} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>
      {open && !collapsed && <div className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  );
}
