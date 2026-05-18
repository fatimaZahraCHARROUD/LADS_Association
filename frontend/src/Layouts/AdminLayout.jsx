import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
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
  ChevronDown,
  ClipboardList,
  X,
} from "lucide-react";
import Topbar from "../components/admin/Topbar";
import { TopSearchProvider } from "../contexts/TopSearchContext";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
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
    />
  );

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-brand-border flex-col shrink-0">
        {sidebarBody}
      </aside>

      {/* MOBILE SIDEBAR + BACKDROP */}
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

      {/* MAIN COLUMN */}
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
  onCloseMobile,
  cmsOpen,
  setCmsOpen,
  msgOpen,
  setMsgOpen,
  logout,
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
        <img
          src="/logo.png"
          alt="LADS"
          className="h-12 w-auto object-contain"
        />
        <button
          className="md:hidden p-1.5 rounded-md text-brand-muted hover:bg-gray-100 transition-colors"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        <SidebarLink to="/admin" end icon={LayoutDashboard}>
          Dashboard
        </SidebarLink>

        <SidebarGroup
          label="Content"
          icon={Database}
          open={cmsOpen}
          onToggle={() => setCmsOpen((o) => !o)}
        >
          <SidebarLink to="/admin/events" icon={Calendar} nested>
            Events
          </SidebarLink>
          <SidebarLink to="/admin/activities" icon={Activity} nested>
            Activities
          </SidebarLink>
          <SidebarLink to="/admin/news" icon={Newspaper} nested>
            News
          </SidebarLink>
          <SidebarLink to="/admin/formations" icon={GraduationCap} nested>
            Formations
          </SidebarLink>
          <SidebarLink to="/admin/info" icon={Settings} nested>
            LADS Info
          </SidebarLink>
        </SidebarGroup>

        <SidebarGroup
          label="Inbox"
          icon={MessageSquare}
          open={msgOpen}
          onToggle={() => setMsgOpen((o) => !o)}
        >
          <SidebarLink to="/admin/contacts" icon={Mail} nested>
            Contacts
          </SidebarLink>
          <SidebarLink to="/admin/membership" icon={Users} nested>
            Membership
          </SidebarLink>
          <SidebarLink to="/admin/eventRegister" icon={ClipboardList} nested>
            Registrations
          </SidebarLink>
        </SidebarGroup>
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
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}
