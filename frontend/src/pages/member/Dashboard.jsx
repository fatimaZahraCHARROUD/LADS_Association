import { Circle, Clock3, FileText, MapPin, UserRound } from "lucide-react";

const tasks = [
  { title: "Review the volunteer event brief", project: "October Community Drive", due: "Today", status: "In progress", color: "bg-blue-50 text-brand-primary" },
  { title: "Confirm your workshop availability", project: "Skills for All", due: "Oct 09", status: "To do", color: "bg-amber-50 text-amber-700" },
  { title: "Share feedback on the welcome guide", project: "Member Onboarding", due: "Oct 12", status: "To do", color: "bg-amber-50 text-amber-700" },
];

const meetings = [
  { day: "08", month: "OCT", title: "Volunteer team check-in", time: "2:00 PM - 2:45 PM", place: "Conference Room A" },
  { day: "10", month: "OCT", title: "Community drive briefing", time: "11:00 AM - 12:00 PM", place: "Online meeting" },
];

const documents = [
  { title: "Volunteer handbook 2026", detail: "PDF · Updated Oct 02", icon: "PDF", color: "bg-rose-50 text-rose-700" },
  { title: "October event schedule", detail: "Document · Updated Sep 29", icon: "DOC", color: "bg-blue-50 text-blue-700" },
  { title: "Member welcome guide", detail: "PDF · Updated Sep 21", icon: "PDF", color: "bg-rose-50 text-rose-700" },
];

export default function MemberDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-primary">Week of October 05</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-brand-text">Welcome back, Sara</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">You have 3 tasks to focus on this week and 2 upcoming meetings. Thanks for helping the community move forward.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand-primary"><UserRound size={23} /></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-border pt-5 sm:grid-cols-4">
          <div><p className="text-xs text-brand-muted">My tasks</p><p className="mt-1 text-lg font-semibold text-brand-text">3 <span className="text-xs font-normal text-brand-muted">open</span></p></div>
          <div><p className="text-xs text-brand-muted">Completed</p><p className="mt-1 text-lg font-semibold text-brand-text">8 <span className="text-xs font-normal text-brand-muted">this month</span></p></div>
          <div><p className="text-xs text-brand-muted">Meetings</p><p className="mt-1 text-lg font-semibold text-brand-text">2 <span className="text-xs font-normal text-brand-muted">upcoming</span></p></div>
          <div><p className="text-xs text-brand-muted">Team</p><p className="mt-1 text-lg font-semibold text-brand-text">Communications</p></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-brand-text">My tasks</h2><p className="mt-1 text-sm text-brand-muted">A short list of what's on your plate</p></div><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand-primary">3 open</span></div>
          <div className="space-y-3">
            {tasks.map((task) => <article key={task.title} className="flex gap-3 rounded-xl border border-brand-border p-3.5 sm:p-4"><span className="mt-0.5 text-brand-muted" aria-hidden="true">{task.status === "In progress" ? <Clock3 size={18} /> : <Circle size={18} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-brand-text">{task.title}</p><p className="mt-1 text-xs text-brand-muted">{task.project} <span className="px-1">·</span> Due {task.due}</p></div><span className={`shrink-0 self-start rounded-md px-2 py-1 text-[11px] font-medium ${task.color}`}>{task.status}</span></article>)}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4"><h2 className="font-semibold text-brand-text">Upcoming meetings</h2><p className="mt-1 text-sm text-brand-muted">Add these to your week</p></div>
          <div className="space-y-3">
            {meetings.map((meeting) => <article key={meeting.title} className="flex gap-3 rounded-xl bg-brand-bg p-3.5"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-brand-primary"><span className="text-base font-bold leading-4">{meeting.day}</span><span className="mt-1 text-[9px] font-semibold tracking-wide">{meeting.month}</span></div><div className="min-w-0"><p className="text-sm font-medium text-brand-text">{meeting.title}</p><p className="mt-1 text-xs text-brand-muted">{meeting.time}</p><p className="mt-1 flex items-center gap-1 text-xs text-brand-muted"><MapPin size={12} /> {meeting.place}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-brand-text">Recent documents</h2><p className="mt-1 text-sm text-brand-muted">Resources shared with your team</p></div><FileText className="text-brand-primary" size={19} /></div>
          <div className="divide-y divide-brand-border">
            {documents.map((document) => <article key={document.title} className="flex items-center gap-3 py-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${document.color}`}>{document.icon}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-brand-text">{document.title}</p><p className="mt-1 text-xs text-brand-muted">{document.detail}</p></div><FileText className="ml-auto shrink-0 text-brand-muted" size={16} /></article>)}
          </div>
        </div>

        <aside className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><UserRound className="text-brand-primary" size={19} /><h2 className="font-semibold text-brand-text">Personal information</h2></div>
          <dl className="divide-y divide-brand-border">
            <div className="py-3"><dt className="text-xs text-brand-muted">Full name</dt><dd className="mt-1 text-sm font-medium text-brand-text">Sara Benali</dd></div>
            <div className="py-3"><dt className="text-xs text-brand-muted">Email</dt><dd className="mt-1 break-all text-sm font-medium text-brand-text">sara.benali@example.org</dd></div>
            <div className="py-3"><dt className="text-xs text-brand-muted">Department</dt><dd className="mt-1 text-sm font-medium text-brand-text">Communications</dd></div>
            <div className="py-3"><dt className="text-xs text-brand-muted">Member since</dt><dd className="mt-1 text-sm font-medium text-brand-text">March 2024</dd></div>
          </dl>
        </aside>
      </section>
    </div>
  );
}