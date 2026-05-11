import { useEffect, useState } from "react";
import {
  Users, Calendar, Activity, Newspaper,
  Mail, UserPlus, ClipboardList, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../services/api";
import StatusBadge from "../../components/admin/StatusBadge";

const STAT_CARDS = [
  { key: "events",        label: "Events",              icon: Calendar,     tint: "bg-blue-100",    color: "text-brand-primary" },
  { key: "activities",    label: "Activities",          icon: Activity,     tint: "bg-emerald-100", color: "text-brand-accent" },
  { key: "news",          label: "News Articles",       icon: Newspaper,    tint: "bg-amber-100",   color: "text-brand-secondary" },
  { key: "users",         label: "Members",             icon: Users,        tint: "bg-indigo-100",  color: "text-indigo-600" },
  { key: "contacts",      label: "Contact Messages",    icon: Mail,         tint: "bg-red-100",     color: "text-brand-danger" },
  { key: "memberships",   label: "Membership Requests", icon: UserPlus,     tint: "bg-sky-100",     color: "text-sky-600" },
  { key: "registrations", label: "Event Registrations", icon: ClipboardList,tint: "bg-violet-100",  color: "text-violet-600" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, activities: 0, news: 0, users: 0, contacts: 0, memberships: 0, registrations: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/users").catch(() => []),
      api.get("/events").catch(() => []),
      api.get("/activities").catch(() => []),
      api.get("/news").catch(() => []),
      api.get("/contact-messages").catch(() => []),
      api.get("/membership-requests").catch(() => []),
      api.get("/event-registrations").catch(() => []),
    ])
      .then(([users, events, activities, news, contacts, memberships, registrations]) => {
        setStats({
          users:         Array.isArray(users)         ? users.length         : 0,
          events:        Array.isArray(events)        ? events.length        : 0,
          activities:    Array.isArray(activities)    ? activities.length    : 0,
          news:          Array.isArray(news)          ? news.length          : 0,
          contacts:      Array.isArray(contacts)      ? contacts.length      : 0,
          memberships:   Array.isArray(memberships)   ? memberships.length   : 0,
          registrations: Array.isArray(registrations) ? registrations.length : 0,
        });
        setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);
        setRecentRequests(Array.isArray(memberships) ? memberships.slice(0, 5) : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-brand-muted py-12">
        <TrendingUp size={20} className="animate-pulse" /> Loading...
      </div>
    );
  }
  if (error) return <div className="text-brand-danger py-8">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-text">Dashboard</h1>
        <p className="text-sm text-brand-muted mt-1">
          Welcome back — here's what's happening.
        </p>
      </header>

      {/* STATS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, tint, color }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-xl border border-brand-border shadow-sm p-4 flex items-center gap-3"
          >
            <div className={`w-11 h-11 rounded-lg ${tint} ${color} flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold text-brand-text leading-tight">
                {stats[key]}
              </p>
              <p className="text-xs text-brand-muted truncate">{label}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* RECENT TABLES */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* RECENT EVENTS */}
        <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border flex items-center gap-2">
            <Calendar size={16} className="text-brand-primary" />
            <h2 className="font-semibold text-brand-text">Recent Events</h2>
          </div>
          {recentEvents.length === 0 ? (
            <p className="px-5 py-8 text-sm text-brand-muted italic">No events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Title</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {recentEvents.map((ev) => (
                  <tr key={ev._id}>
                    <td className="px-4 py-2.5">{ev.title?.en || ev.title?.fr || "—"}</td>
                    <td className="px-4 py-2.5">{ev.date ? new Date(ev.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge variant={ev.status === "past" ? "past" : "upcoming"}>
                        {ev.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge variant={ev.isPublished ? "published" : "draft"}>
                        {ev.isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RECENT MEMBERSHIP REQUESTS */}
        <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border flex items-center gap-2">
            <UserPlus size={16} className="text-sky-600" />
            <h2 className="font-semibold text-brand-text">Recent Membership Requests</h2>
          </div>
          {recentRequests.length === 0 ? (
            <p className="px-5 py-8 text-sm text-brand-muted italic">No requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Email</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">City</th>
                  <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {recentRequests.map((req) => (
                  <tr key={req._id}>
                    <td className="px-4 py-2.5">{req.fullName}</td>
                    <td className="px-4 py-2.5 text-brand-muted">{req.email}</td>
                    <td className="px-4 py-2.5">{req.city || "—"}</td>
                    <td className="px-4 py-2.5 text-brand-muted">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
