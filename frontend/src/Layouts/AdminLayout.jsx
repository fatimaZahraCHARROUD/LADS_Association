import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Database, MessageSquare, Calendar, Activity,
  Newspaper, GraduationCap, Mail, Users, Settings, LogOut,
  ChevronDown, ClipboardList, FileText, CalendarClock, Building2, X,
  BarChart3,FolderKanban, Layers
} from "lucide-react";
import Topbar from "../components/admin/Topbar";
import { TopSearchProvider } from "../contexts/TopSearchContext";
import RoleSwitcher from "../components/RoleSwitcher";

const BASE = {
  President: "/admin",
  "Director Executive": "/exec",
  "Team Manager": "/team",
  Responsable: "/responsible",
  Member: "/member",
};

const MENU = {
  President: [
    "dashboard", "members", "departments","projects",
    "events", "news", "activities", "formations", "info",
    "documents", "meetings",
    "contacts", "membership", "eventRegister",
  ],
  "Director Executive": [
    "dashboard",
    "strategic",
    "members",     "documents", "meetings",
    "followup",
  ],
  "Team Manager": [
    "dashboard",
    "members", "documents", "meetings",
    "followup",
  ],
  Responsable: [
    "dashboard",
    "cellules", "members", "documents", "meetings",
    "objectives", "tasks",
  ],
  Member: [
    "dashboard",
    "documents", "meetings",
    "formations", "tasks",
  ],
};

export default function AdminLayout() {
  return (
    <TopSearchProvider>
      <AdminShell />
    </TopSearchProvider>
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cmsOpen, setCmsOpen] = useState(true);
  const [msgOpen, setMsgOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const active = (user.memberships || []).find(
    (m) => String(m._id) === String(user.activeMembershipId)
  );
  const activeRole = user.isAdmin ? "President" : active?.role;
  const base = BASE[activeRole] || "/admin";
  const allowed = MENU[activeRole] || [];

  const can = (key) => allowed.includes(key);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const sidebarBody = (
    <SidebarBody
      onCloseMobile={() => setMobileOpen(false)}
      cmsOpen={cmsOpen}
      setCmsOpen={setCmsOpen}
      msgOpen={msgOpen}
      setMsgOpen={setMsgOpen}
      logout={logout}
      base={base}
      can={can}
    />
  );

  useEffect(() => {
    document.documentElement.dir = "ltr";
  }, []);

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <aside className="hidden md:flex w-64 bg-white border-r border-brand-border flex-col shrink-0">
        {sidebarBody}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-brand-border flex flex-col">
            {sidebarBody}
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  onCloseMobile, cmsOpen, setCmsOpen, msgOpen, setMsgOpen, logout, base, can,
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border" dir="ltr">
        <img src="/logo.png" alt="LADS" className="h-12 w-auto object-contain" />
        <button
          className="md:hidden p-1.5 rounded-md text-brand-muted hover:bg-gray-100 transition-colors"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 pt-3">
        <RoleSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {/* Dashboard */}
        {can("dashboard") && (
          <SidebarLink to={base} end icon={LayoutDashboard}>
            Dashboard
          </SidebarLink>
        )}

        {/* Members */}
        {can("members") && (
          <SidebarLink to={`${base}/members`} icon={Users}>
            Members
          </SidebarLink>
        )}

        {/* Cellules (Responsable) */}
        {can("cellules") && (
          <SidebarLink to={`${base}/cellules`} icon={Layers}>
            Cellules
          </SidebarLink>
        )}

        {/* Departments */}
        {can("departments") && (
          <SidebarLink to={`${base}/departments`} icon={Building2}>
            Departments
          </SidebarLink>
        )}

{/* Projects */}
{can("projects") && (
  <SidebarLink to={`${base}/projects`} icon={FolderKanban}>
    Projects
  </SidebarLink>
)}

        {/* Strategic Plans (Exec only) */}
        {can("strategic") && (
          <SidebarLink to={`${base}/strategic`} icon={FileText}>
            Strategic Plans
          </SidebarLink>
        )}

        {/* Content group (President only) */}
        {(can("events") || can("activities") || can("news") || can("info")) && (
          <SidebarGroup
            label="Content"
            icon={Database}
            open={cmsOpen}
            onToggle={() => setCmsOpen((o) => !o)}
          >
            {can("events") && (
              <SidebarLink to={`${base}/events`} icon={Calendar} nested>Events</SidebarLink>
            )}
            {can("activities") && (
              <SidebarLink to={`${base}/activities`} icon={Activity} nested>Activities</SidebarLink>
            )}
            {can("news") && (
              <SidebarLink to={`${base}/news`} icon={Newspaper} nested>News</SidebarLink>
            )}
            {can("info") && (
              <SidebarLink to={`${base}/info`} icon={Settings} nested>LADS Info</SidebarLink>
            )}
          </SidebarGroup>
        )}

        {/* Documents */}
        {can("documents") && (
          <SidebarLink to={`${base}/documents`} icon={FileText}>
            Documents
          </SidebarLink>
        )}

        {/* Meetings */}
        {can("meetings") && (
          <SidebarLink to={`${base}/meetings`} icon={CalendarClock}>
            Meetings
          </SidebarLink>
        )}

        {/* Objectives (Responsable) */}
        {can("objectives") && (
          <SidebarLink to={`${base}/objectives`} icon={Activity}>
            Objectives
          </SidebarLink>
        )}

        {/* Tasks (Responsable / Member) */}
        {can("tasks") && (
          <SidebarLink to={`${base}/tasks`} icon={ClipboardList}>
            Tasks
          </SidebarLink>
        )}

        {/* Formations (Member) */}
        {can("formations") && (
          <SidebarLink to={`${base}/formations`} icon={GraduationCap}>
            Formations
          </SidebarLink>
        )}

        {/* Statistics & Follow-up (Exec / Team) */}
        {can("followup") && (
          <SidebarLink to={`${base}/followup`} icon={BarChart3}>
            Statistics & Follow-up
          </SidebarLink>
        )}

        {/* Inbox group (President only) */}
        {(can("contacts") || can("membership") || can("eventRegister")) && (
          <SidebarGroup
            label="Inbox"
            icon={MessageSquare}
            open={msgOpen}
            onToggle={() => setMsgOpen((o) => !o)}
          >
            {can("contacts") && (
              <SidebarLink to={`${base}/contacts`} icon={Mail} nested>Contacts</SidebarLink>
            )}
            {can("membership") && (
              <SidebarLink to={`${base}/membership`} icon={Users} nested>Membership</SidebarLink>
            )}
            {can("eventRegister") && (
              <SidebarLink to={`${base}/eventRegister`} icon={ClipboardList} nested>Registrations</SidebarLink>
            )}
          </SidebarGroup>
        )}
      </nav>

      <div className="p-4 border-t border-brand-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-brand-muted hover:bg-red-50 hover:text-brand-danger transition-colors"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </>
  );
}

function SidebarLink({ to, end, icon: Icon, nested, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
          nested ? "ml-2" : ""
        } ${
          isActive
            ? "bg-brand-primary text-white shadow-sm font-medium"
            : "text-brand-muted hover:bg-gray-50 hover:text-brand-text"
        }`
      }
    >
      <Icon size={nested ? 16 : 18} />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function SidebarGroup({ label, icon: Icon, open, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-brand-muted hover:bg-gray-50 hover:text-brand-text transition-colors"
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}