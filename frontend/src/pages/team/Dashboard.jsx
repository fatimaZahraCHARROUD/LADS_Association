import { CalendarDays, Circle, Clock3, FolderKanban } from "lucide-react";
import StatCard from "../../components/statcard";

const stats = [
  { label: "Departments", value: 6, color: "text-brand-primary", ring: "#2563eb", change: 1 },
  { label: "Members", value: 84, color: "text-indigo-500", ring: "#6366f1", change: 8 },
  { label: "Projects", value: 12, color: "text-emerald-500", ring: "#10b981", change: 2 },
  { label: "Upcoming Meetings", value: 3, color: "text-orange-500", ring: "#f97316", change: 1 },
];

const projects = [
  { name: "Volunteer onboarding refresh", department: "Member Experience", progress: 68, due: "Oct 18", color: "bg-brand-primary" },
  { name: "Winter community drive", department: "Communications", progress: 42, due: "Nov 04", color: "bg-emerald-500" },
  { name: "Partner resource directory", department: "Partnerships", progress: 86, due: "Oct 12", color: "bg-orange-500" },
];

const tasks = [
  { title: "Review outreach event brief", owner: "Sara Benali", due: "Today", priority: "High" },
  { title: "Confirm workshop facilitators", owner: "Youssef Amrani", due: "Oct 09", priority: "Normal" },
  { title: "Share monthly progress update", owner: "Nadia El Idrissi", due: "Oct 11", priority: "Normal" },
];

export default function TeamDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">Team workspace</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">Dashboard</h1>
          <p className="mt-1 text-sm text-brand-muted">Track active work and keep the team moving.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted"><Clock3 size={16} /> This week</div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Team statistics">
        {stats.map((stat) => (
          <StatCard key={stat.label} def={stat} stat={{ value: stat.value, ring: 68, change: stat.change }} pillSuffix="this month" />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Active projects</h2>
              <p className="mt-1 text-sm text-brand-muted">3 projects underway across your departments</p>
            </div>
            <FolderKanban className="text-brand-primary" size={20} />
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <article key={project.name} className="rounded-xl px-1 py-4 first:pt-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-brand-text">{project.name}</h3>
                    <p className="mt-1 text-xs text-brand-muted">{project.department} <span className="px-1">·</span> Due {project.due}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-text">{project.progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${project.color}`} style={{ width: `${project.progress}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Pending tasks</h2>
              <p className="mt-1 text-sm text-brand-muted">Items that need a team follow-up</p>
            </div>
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">3 open</span>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <article key={task.title} className="flex gap-3 rounded-xl bg-brand-bg p-3.5">
                <span className="mt-0.5 text-brand-muted"><Circle size={17} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text">{task.title}</p>
                  <p className="mt-1 text-xs text-brand-muted">{task.owner} <span className="px-1">·</span> Due {task.due}</p>
                </div>
                <span className={`self-start rounded-md px-2 py-1 text-[11px] font-medium ${task.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-white text-brand-muted"}`}>{task.priority}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-border bg-white p-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-primary"><CalendarDays size={19} /></span>
          <div><h2 className="text-sm font-semibold text-brand-text">Next team meeting</h2><p className="mt-1 text-sm text-brand-muted">Project check-in <span className="px-1">·</span> Thursday, Oct 08 at 2:00 PM</p></div>
        </div>
        <span className="text-sm text-brand-muted">Conference Room A</span>
      </section>
    </div>
  );
}