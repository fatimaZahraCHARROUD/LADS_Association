import { CalendarDays, Check, Clock3, Target, Users } from "lucide-react";

const team = [
  { initials: "SB", name: "Sara Benali", role: "Communications lead", color: "bg-blue-100 text-blue-700" },
  { initials: "YA", name: "Youssef Amrani", role: "Events coordinator", color: "bg-emerald-100 text-emerald-700" },
  { initials: "NE", name: "Nadia El Idrissi", role: "Volunteer coordinator", color: "bg-orange-100 text-orange-700" },
  { initials: "MK", name: "Mehdi Karim", role: "Content volunteer", color: "bg-indigo-100 text-indigo-700" },
];

const tasks = [
  { title: "Finalize volunteer schedule", due: "Today", priority: "High" },
  { title: "Review event announcement", due: "Oct 09", priority: "Normal" },
  { title: "Prepare weekly team update", due: "Oct 10", priority: "Normal" },
];

export default function RespDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">Department overview</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">Dashboard</h1>
          <p className="mt-1 text-sm text-brand-muted">Your team's priorities and progress for the week.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted"><Clock3 size={16} /> Week of Oct 05</div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl bg-brand-sidebar p-5 text-white sm:p-6 xl:col-span-2">
          <div className="absolute -right-7 -top-8 h-36 w-36 rounded-full border-[22px] border-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-200"><Target size={17} /> This week's objective</div>
            <h2 className="mt-4 max-w-xl text-xl font-semibold">Prepare and launch the October community volunteer drive</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Coordinate the schedule, confirm volunteers, and publish the final event information.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="min-w-48 flex-1">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">Weekly progress</span><span className="font-semibold text-white">65%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[65%] rounded-full bg-emerald-400" /></div>
              </div>
              <span className="rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">Due Friday, Oct 09</span>
            </div>
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-primary"><Users size={20} /></span>
            <span className="text-xs font-medium text-emerald-700">Active team</span>
          </div>
          <div className="mt-5"><p className="text-sm text-brand-muted">Members count</p><p className="mt-1 text-3xl font-bold text-brand-text">12</p><p className="mt-1 text-sm text-brand-muted">Across 3 working groups</p></div>
          <div className="mt-5 flex -space-x-2" aria-label="Team member avatars">
            {team.slice(0, 4).map((member) => <span key={member.initials} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold ${member.color}`}>{member.initials}</span>)}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-brand-muted">+8</span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Task statistics">
        <div className="rounded-2xl border border-brand-border bg-white p-5"><p className="text-sm text-brand-muted">Pending tasks</p><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-bold text-brand-text">7</p><span className="mb-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">3 due this week</span></div></div>
        <div className="rounded-2xl border border-brand-border bg-white p-5"><p className="text-sm text-brand-muted">Completed tasks</p><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-bold text-brand-text">18</p><span className="mb-1 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check size={13} /> This month</span></div></div>
        <div className="rounded-2xl border border-brand-border bg-white p-5"><p className="text-sm text-brand-muted">Upcoming meetings</p><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-bold text-brand-text">2</p><span className="mb-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand-primary">Next: Thu, 2 PM</span></div></div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-brand-text">My team</h2><p className="mt-1 text-sm text-brand-muted">Your closest collaborators</p></div><Users className="text-brand-primary" size={19} /></div>
          <div className="divide-y divide-brand-border">
            {team.map((member) => <div key={member.initials} className="flex items-center gap-3 py-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${member.color}`}>{member.initials}</span><div className="min-w-0"><p className="text-sm font-medium text-brand-text">{member.name}</p><p className="mt-0.5 text-xs text-brand-muted">{member.role}</p></div></div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-brand-text">Pending tasks</h2><p className="mt-1 text-sm text-brand-muted">Next items to coordinate</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">7 open</span></div>
          <div className="space-y-3">
            {tasks.map((task) => <article key={task.title} className="flex items-start gap-3 rounded-xl bg-brand-bg p-3.5"><span className="mt-0.5 text-brand-muted"><Clock3 size={16} /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-brand-text">{task.title}</p><p className="mt-1 text-xs text-brand-muted">Due {task.due}</p></div><span className={`rounded-md px-2 py-1 text-[11px] font-medium ${task.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-white text-brand-muted"}`}>{task.priority}</span></article>)}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-brand-border pt-4 text-sm text-brand-muted"><CalendarDays size={16} /> Team stand-up <span className="text-brand-text">Thursday, Oct 08 at 2:00 PM</span></div>
        </div>
      </section>
    </div>
  );
}