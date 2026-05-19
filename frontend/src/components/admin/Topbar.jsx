import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Bell, Mail, ChevronDown, LogOut, Menu, Users, ClipboardList,
} from "lucide-react";
import { api } from "../../services/api";
import { useTopSearch } from "../../contexts/TopSearchContext";
import { useNotifications } from "../../contexts/NotificationsContext";

function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "A";
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

export default function Topbar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/admin" || pathname === "/admin/";
  const { query, setQuery } = useTopSearch();
const { counts, setCounts } = useNotifications();  const [bellOpen, setBellOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef(null);
  const mailRef = useRef(null);
  const profileRef = useRef(null);

  const user = decodeJwt(localStorage.getItem("token")) || {};
  const displayName = user.name || user.fullName || user.email || "Admin";
  const initials = getInitials(displayName);

  useEffect(() => {
    let cancelled = false;
    const unreadCount = (arr) =>
      Array.isArray(arr) ? arr.filter((it) => !it?.readAt).length : 0;
    Promise.all([
      api.get("/contact-messages").catch(() => []),
      api.get("/membership-requests").catch(() => []),
      api.get("/event-registrations").catch(() => []),
    ]).then(([c, m, r]) => {
      if (cancelled) return;
      setCounts({
        contacts: unreadCount(c),
        memberships: unreadCount(m),
        registrations: unreadCount(r),
      });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (mailRef.current && !mailRef.current.contains(e.target)) setMailOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isDashboard) setQuery("");
  }, [isDashboard, setQuery]);

  const total = counts.contacts + counts.memberships + counts.registrations;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="h-20 bg-white flex items-center gap-2 sm:gap-4 px-3 sm:px-8 shrink-0">
      {onOpenSidebar && (
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg text-brand-text hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {!isDashboard && (
        <div className="relative flex-1 max-w-2xl">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-12 pr-4 py-3 text-sm bg-brand-bg border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white focus:border-brand-border transition-colors"
          />
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* MAIL */}
        <div className="relative" ref={mailRef}>
          <button
            onClick={() => setMailOpen((o) => !o)}
            className="relative p-2.5 rounded-full text-brand-text hover:bg-gray-100"
            aria-label="Messages"
          >
            <Mail size={20} />
            {counts.contacts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-danger" />
            )}
          </button>
          {mailOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-brand-border">
                <p className="text-sm font-semibold text-brand-text">Messages</p>
                <p className="text-xs text-brand-muted">
                  {counts.contacts === 0 ? "All caught up" : `${counts.contacts} unread`}
                </p>
              </div>
              <NotifItem to="/admin/contacts" icon={<Mail size={16} />} label="Open inbox" count={counts.contacts} onClick={() => setMailOpen(false)} />
            </div>
          )}
        </div>

        {/* BELL */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative p-2.5 rounded-full text-brand-text hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {total > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-danger" />
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-brand-border">
                <p className="text-sm font-semibold text-brand-text">Notifications</p>
                <p className="text-xs text-brand-muted">
                  {total === 0 ? "All caught up" : `${total} unread`}
                </p>
              </div>
              <NotifItem to="/admin/contacts" icon={<Mail size={16} />} label="Contact messages" count={counts.contacts} onClick={() => setBellOpen(false)} />
              <NotifItem to="/admin/membership" icon={<Users size={16} />} label="Membership requests" count={counts.memberships} onClick={() => setBellOpen(false)} />
              <NotifItem to="/admin/eventRegister" icon={<ClipboardList size={16} />} label="Event registrations" count={counts.registrations} onClick={() => setBellOpen(false)} />
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="relative ml-1 sm:ml-2" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1 rounded-full hover:bg-gray-50"
          >
            <span className="w-10 h-10 rounded-full bg-brand-primary text-white text-sm font-semibold flex items-center justify-center">
              {initials}
            </span>
            <span className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-brand-text truncate max-w-[140px]">
                {displayName}
              </span>
              {user.email && user.email !== displayName && (
                <span className="text-xs text-brand-muted truncate max-w-[140px]">
                  {user.email}
                </span>
              )}
            </span>
            <ChevronDown size={16} className="hidden sm:block text-brand-muted shrink-0" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-brand-border">
                <p className="text-sm font-medium text-brand-text truncate">{displayName}</p>
                {user.email && user.email !== displayName && (
                  <p className="text-xs text-brand-muted truncate">{user.email}</p>
                )}
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-danger hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotifItem({ to, icon, label, count, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors"
    >
      <span className="text-brand-muted">{icon}</span>
      <span className="flex-1 text-sm text-brand-text">{label}</span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          count > 0 ? "bg-blue-100 text-brand-primary" : "bg-gray-100 text-brand-muted"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
