import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import StatCard from "../../components/statcard";

const stats = [
  { label: "Departments", value: 6, color: "text-brand-primary", ring: "#2563eb", change: 1 },
  { label: "Members", value: 84, color: "text-indigo-500", ring: "#6366f1", change: 8 },
  { label: "Projects", value: 12, color: "text-emerald-500", ring: "#10b981", change: 2 },
  { label: "Upcoming Meetings", value: 3, color: "text-orange-500", ring: "#f97316", change: 1 },
];

const meetings = [
  { title: "Executive Board Check-in", date: "Thu, Oct 08", time: "10:00 AM", detail: "Quarterly priorities review" },
  { title: "Department Leads Forum", date: "Sat, Oct 10", time: "2:00 PM", detail: "Cross-team project updates" },
  { title: "Partnerships Review", date: "Thu, Oct 15", time: "11:30 AM", detail: "Community partner planning" },
];

const plans = [
  { title: "Expand community outreach", owner: "Communications", progress: 72, color: "bg-brand-primary", due: "Due Nov 15" },
  { title: "Launch the mentorship program", owner: "Member Experience", progress: 48, color: "bg-emerald-500", due: "Due Dec 02" },
  { title: "Strengthen partner network", owner: "Partnerships", progress: 31, color: "bg-amber-500", due: "Due Dec 18" },
];

const departments = [
  { name: "Communications", members: 18, projects: 4, color: "bg-brand-primary" },
  { name: "Member Experience", members: 14, projects: 3, color: "bg-emerald-500" },
  { name: "Partnerships", members: 12, projects: 2, color: "bg-orange-500" },
  { name: "Operations", members: 10, projects: 3, color: "bg-indigo-500" },
];

const activities = [
  { title: "Mentorship program proposal approved", detail: "Executive Board", time: "Today, 10:24 AM", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { title: "Community outreach plan updated", detail: "Communications", time: "Yesterday", icon: FileText, color: "text-brand-primary bg-blue-50" },
  { title: "Monthly leadership meeting scheduled", detail: "Operations", time: "Oct 01", icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
];

export default function ExecDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">Executive overview</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">Dashboard</h1>
          <p className="mt-1 text-sm text-brand-muted">A clear view of the association's priorities and progress.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted">
          <Clock3 size={16} /> Updated today
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Organization statistics">
        {stats.map((stat) => (
          <StatCard key={stat.label} def={stat} stat={{ value: stat.value, ring: 68, change: stat.change }} pillSuffix="this month" />
        ))}
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-brand-text">Upcoming meetings</h2>
            <p className="mt-1 text-sm text-brand-muted">Key dates for the executive team</p>
          </div>
          <CalendarDays className="text-brand-primary" size={20} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {meetings.map((meeting) => (
            <article key={meeting.title} className="rounded-xl bg-brand-bg p-4">
              <p className="text-sm font-medium text-brand-text">{meeting.title}</p>
              <p className="mt-2 text-sm text-brand-primary">{meeting.date} <span className="px-1">·</span> {meeting.time}</p>
              <p className="mt-1 text-xs text-brand-muted">{meeting.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Strategic plans</h2>
              <p className="mt-1 text-sm text-brand-muted">Progress against this year's priorities</p>
            </div>
            <FileText className="text-brand-primary" size={20} />
          </div>
          <div className="space-y-5">
            {plans.map((plan) => (
              <div key={plan.title}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{plan.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">{plan.owner} <span className="px-1">·</span> {plan.due}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-text">{plan.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${plan.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">Departments overview</h2>
              <p className="mt-1 text-sm text-brand-muted">Teams and active work</p>
            </div>
            <Users className="text-brand-primary" size={20} />
          </div>
          <div className="divide-y divide-brand-border">
            {departments.map((department) => (
              <div key={department.name} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${department.color}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-text">{department.name}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">{department.members} members</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-brand-muted">{department.projects} projects</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-brand-text">Recent activities</h2>
            <p className="mt-1 text-sm text-brand-muted">Latest updates across the association</p>
          </div>
          <ArrowUpRight className="text-brand-muted" size={18} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <article key={activity.title} className="flex gap-3 rounded-xl bg-brand-bg p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.color}`}><Icon size={17} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-text">{activity.title}</p>
                  <p className="mt-1 text-xs text-brand-muted">{activity.detail} <span className="px-1">·</span> {activity.time}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}