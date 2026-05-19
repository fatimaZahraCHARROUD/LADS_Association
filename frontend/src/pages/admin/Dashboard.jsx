import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronDown, MoreHorizontal } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../services/api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PERIOD = {
  week:  { label: "Weekly",  pillSuffix: "this week",  days: 7 },
  month: { label: "Monthly", pillSuffix: "this month", days: 30 },
  year:  { label: "Yearly",  pillSuffix: "this year",  days: 365 },
};
const PERIOD_KEYS = ["week", "month", "year"];

const CARD_DEFS = [
  { key: "events",      label: "Total Events",      color: "text-orange-500",  ring: "#f97316" },
  { key: "activities",  label: "Total Activities",  color: "text-emerald-500", ring: "#10b981" },
  { key: "news",        label: "Total News",        color: "text-brand-primary", ring: "#2563eb" },
  { key: "formations",  label: "Total Formations",  color: "text-purple-500",  ring: "#a855f7" },
  { key: "memberships", label: "Total Memberships", color: "text-indigo-500",  ring: "#6366f1" },
  { key: "contacts",    label: "Total Contacts",    color: "text-rose-500",    ring: "#f43f5e" },
];

const MIX_COLORS = ["#f97316", "#10b981", "#2563eb", "#a855f7"];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function countInRange(items, startMs, endMs) {
  return items.filter((it) => {
    if (!it?.createdAt) return false;
    const t = new Date(it.createdAt).getTime();
    return t >= startMs && t < endMs;
  }).length;
}

function buildBuckets(items, period) {
  if (period === "year") {
    const buckets = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        day: start.toLocaleString("en-US", { month: "short" }),
        count: countInRange(items, start.getTime(), end.getTime()),
      });
    }
    return buckets;
  }
  const n = period === "week" ? 7 : 30;
  const today = startOfDay(new Date());
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const label = period === "week"
      ? DAY_LABELS[start.getDay()]
      : String(start.getDate()).padStart(2, "0");
    buckets.push({
      day: label,
      count: countInRange(items, start.getTime(), end.getTime()),
    });
  }
  return buckets;
}

function countNewInPeriod(items, period) {
  if (!Array.isArray(items)) return 0;
  const cutoff = Date.now() - PERIOD[period].days * 24 * 60 * 60 * 1000;
  return items.filter(
    (it) => it?.createdAt && new Date(it.createdAt).getTime() >= cutoff
  ).length;
}

function pctPublished(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const pub = items.filter((it) => it?.isPublished).length;
  return Math.round((pub / items.length) * 100);
}

export default function Dashboard() {
  const [data, setData] = useState({
    events: [], activities: [], news: [], formations: [],
    memberships: [], contacts: [], registrations: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/events").catch(() => []),
      api.get("/activities").catch(() => []),
      api.get("/news").catch(() => []),
      api.get("/formations").catch(() => []),
      api.get("/membership-requests").catch(() => []),
      api.get("/contact-messages").catch(() => []),
      api.get("/event-registrations").catch(() => []),
    ]).then(([events, activities, news, formations, memberships, contacts, registrations]) => {
      setData({
        events: Array.isArray(events) ? events : [],
        activities: Array.isArray(activities) ? activities : [],
        news: Array.isArray(news) ? news : [],
        formations: Array.isArray(formations) ? formations : [],
        memberships: Array.isArray(memberships) ? memberships : [],
        contacts: Array.isArray(contacts) ? contacts : [],
        registrations: Array.isArray(registrations) ? registrations : [],
      });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!periodOpen) return undefined;
    const handler = (e) => {
      if (periodRef.current && !periodRef.current.contains(e.target)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [periodOpen]);

  const stats = useMemo(() => {
    const change = (arr) => countNewInPeriod(arr, period);
    const ringForInbox = (arr) =>
      arr.length > 0
        ? Math.min(100, Math.round((change(arr) / arr.length) * 100))
        : 0;
    return {
      events:      { value: data.events.length,      ring: pctPublished(data.events),      change: change(data.events) },
      activities:  { value: data.activities.length,  ring: pctPublished(data.activities),  change: change(data.activities) },
      news:        { value: data.news.length,        ring: pctPublished(data.news),        change: change(data.news) },
      formations:  { value: data.formations.length,  ring: pctPublished(data.formations),  change: change(data.formations) },
      memberships: { value: data.memberships.length, ring: ringForInbox(data.memberships), change: change(data.memberships) },
      contacts:    { value: data.contacts.length,    ring: ringForInbox(data.contacts),    change: change(data.contacts) },
    };
  }, [data, period]);

  const chartData = useMemo(() => buildBuckets([
    ...data.events, ...data.activities, ...data.news, ...data.formations,
    ...data.memberships, ...data.contacts, ...data.registrations,
  ], period), [data, period]);

  const mixData = useMemo(() => [
    { name: "Events",     value: data.events.length },
    { name: "Activities", value: data.activities.length },
    { name: "News",       value: data.news.length },
    { name: "Formations", value: data.formations.length },
  ], [data]);
  const mixTotal = mixData.reduce((acc, x) => acc + x.value, 0);

  if (loading) {
    return (
      <div className="text-brand-muted py-12 text-sm">Loading dashboard…</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-text">Dashboard</h1>

        <div className="relative" ref={periodRef}>
          <button
            onClick={() => setPeriodOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            {PERIOD[period].label}
            <ChevronDown
              size={16}
              className={`transition-transform ${periodOpen ? "rotate-180" : ""}`}
            />
          </button>
          {periodOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden z-30">
              {PERIOD_KEYS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setPeriodOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    p === period
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "text-brand-text hover:bg-gray-50"
                  }`}
                >
                  {PERIOD[p].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* STATS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {CARD_DEFS.map((def, i) => {
          const s = stats[def.key];
          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <StatCard def={def} stat={s} pillSuffix={PERIOD[period].pillSuffix} />
            </motion.div>
          );
        })}
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-brand-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-brand-text">
                Activity{" "}
                <span className="text-brand-muted text-sm font-normal">
                  ({PERIOD[period].label})
                </span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">New items created across the platform.</p>
            </div>
            <button className="p-1.5 rounded-md text-brand-muted hover:bg-gray-100">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} interval={period === "month" ? 2 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-brand-text">Content Mix</h2>
            <button className="p-1.5 rounded-md text-brand-muted hover:bg-gray-100">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mixData}
                  innerRadius={60}
                  outerRadius={86}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {mixData.map((_, idx) => (
                    <Cell key={idx} fill={MIX_COLORS[idx % MIX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-brand-text">{mixTotal}</span>
              <span className="text-xs text-brand-muted">items</span>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4">
            {mixData.map((m, idx) => (
              <li key={m.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: MIX_COLORS[idx % MIX_COLORS.length] }} />
                <span className="text-brand-muted flex-1 truncate">{m.name}</span>
                <span className="font-semibold text-brand-text">{m.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({ def, stat, pillSuffix }) {
  const trendUp = stat.change > 0;
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${def.color}`}>{def.label}</p>
        <button className="p-1 rounded-md text-brand-muted hover:bg-gray-100">
          <MoreHorizontal size={16} />
        </button>
      </div>
      <p className="text-4xl font-bold text-brand-text leading-none">{stat.value}</p>
      <div className="flex items-end justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trendUp
              ? "bg-emerald-50 text-emerald-600"
              : "bg-gray-50 text-brand-muted"
          }`}
        >
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {stat.change} {pillSuffix}
        </span>
        <Ring percent={stat.ring} color={def.ring} />
      </div>
    </div>
  );
}

function Ring({ percent, color }) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const data = [
    { name: "filled", value: safe },
    { name: "rest", value: 100 - safe },
  ];
  return (
    <div className="relative w-14 h-14">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={26}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-brand-text">
        {safe}%
      </span>
    </div>
  );
}
