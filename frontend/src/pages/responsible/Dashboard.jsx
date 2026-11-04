import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock3, Target, Users } from "lucide-react";
import { api } from "../../services/api";

const formatDate = (value, options = { month: "short", day: "numeric" }) =>
  value
    ? new Date(value).toLocaleDateString(undefined, options)
    : "Date not set";
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

export default function RespDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const overview = dashboard?.overview;
  const objectives = dashboard?.data?.objectives ?? [];
  const objective = objectives[0];
  const members = dashboard?.data?.members ?? [];
  const tasks = dashboard?.data?.pendingTasks ?? [];
  const meetings = dashboard?.data?.upcomingMeetings ?? [];

  useEffect(() => {
    const controller = new AbortController();
    api
      .getResponsableDashboard({ signal: controller.signal })
      .then((data) => {
        const requiredCounts = [
          "totalMembers",
          "totalPendingTasks",
          "totalCompletedTasks",
          "totalUpcomingMeetings",
        ];
        if (
          !data?.overview ||
          !requiredCounts.every((key) => Number.isFinite(data.overview[key]))
        ) {
          throw new Error("Statistics response is missing required counts.");
        }
        for (const key of [
          "objectives",
          "members",
          "pendingTasks",
          "upcomingMeetings",
        ]) {
          if (!Array.isArray(data?.data?.[key])) {
            throw new Error(
              `Responsable dashboard response is missing ${key}.`,
            );
          }
        }
        setDashboard(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDashboardError(
            error.message || "Unable to load Responsable dashboard.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });

    return () => controller.abort();
  }, []);

  const sectionState = (label, values) => {
    if (dashboardLoading)
      return <p className="text-sm text-brand-muted">Loading {label}…</p>;
    if (dashboardError)
      return (
        <p role="alert" className="text-sm text-rose-700">
          {dashboardError}
        </p>
      );
    if (!values.length)
      return <p className="text-sm text-brand-muted">No {label} found.</p>;
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">
            Department overview
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Your team's priorities and progress for the week.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-muted">
          <Clock3 size={16} /> Week of{" "}
          {formatDate(new Date(), { month: "short", day: "numeric" })}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl bg-brand-sidebar p-5 text-white sm:p-6 xl:col-span-2">
          <div className="absolute -right-7 -top-8 h-36 w-36 rounded-full border-[22px] border-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
              <Target size={17} /> This week's objective
            </div>
            {dashboardLoading && (
              <p className="mt-4 text-sm text-slate-200">
                Loading this week's objective…
              </p>
            )}
            {dashboardError && (
              <p role="alert" className="mt-4 text-sm text-rose-200">
                {dashboardError}
              </p>
            )}
            {!dashboardLoading && !dashboardError && !objective && (
              <p className="mt-4 text-sm text-slate-200">
                No objective is scheduled for this week.
              </p>
            )}
            {!dashboardLoading && !dashboardError && objective && (
              <>
                <h2 className="mt-4 max-w-xl text-xl font-semibold">
                  {objective.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  {objective.description ||
                    objective.departmentId?.name ||
                    "No objective details provided."}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-48 flex-1">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-300">Weekly progress</span>
                      <span className="font-semibold text-white">
                        {Number(objective.progress) || 0}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(objective.progress) || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
                    {formatDate(objective.weekStart)} –{" "}
                    {formatDate(objective.weekEnd)}
                  </span>
                </div>
              </>
            )}
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-primary">
              <Users size={20} />
            </span>
            <span className="text-xs font-medium text-emerald-700">
              My team
            </span>
          </div>
          <div className="mt-5">
            <p className="text-sm text-brand-muted">Members count</p>
            <p className="mt-1 text-3xl font-bold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalMembers}
            </p>
            {dashboardError && (
              <p role="alert" className="mt-1 text-xs text-rose-700">
                {dashboardError}
              </p>
            )}
          </div>
          <div
            className="mt-5 flex -space-x-2"
            aria-label="Team member avatars"
          >
            {members.slice(0, 4).map((member, index) => (
              <span
                key={member._id}
                title={member.fullName}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold ${avatarColors[index % avatarColors.length]}`}
              >
                {initials(member.fullName)}
              </span>
            ))}
            {members.length > 4 && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-brand-muted">
                +{members.length - 4}
              </span>
            )}
          </div>
        </article>
      </section>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        aria-label="Task statistics"
      >
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Pending tasks</p>
          <p className="mt-3 text-3xl font-bold text-brand-text">
            {dashboardLoading
              ? "…"
              : dashboardError
                ? "—"
                : overview.totalPendingTasks}
          </p>
          {dashboardError && (
            <p role="alert" className="mt-1 text-xs text-rose-700">
              {dashboardError}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Completed tasks</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalCompletedTasks}
            </p>
            <span className="mb-1 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <Check size={13} /> All time
            </span>
          </div>
          {dashboardError && (
            <p role="alert" className="mt-1 text-xs text-rose-700">
              {dashboardError}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-sm text-brand-muted">Upcoming meetings</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-bold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalUpcomingMeetings}
            </p>
            <span className="mb-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand-primary">
              Next dates
            </span>
          </div>
          {dashboardError && (
            <p role="alert" className="mt-1 text-xs text-rose-700">
              {dashboardError}
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">My team</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Members in your department
              </p>
            </div>
            <Users className="text-brand-primary" size={19} />
          </div>
          <div className="divide-y divide-brand-border">
            {sectionState("team members", members)}
            {!dashboardLoading &&
              !dashboardError &&
              members.map((member, index) => (
                <div key={member._id} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColors[index % avatarColors.length]}`}
                  >
                    {initials(member.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text">
                      {member.fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {member.status || "Member"}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">Pending tasks</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Next items to coordinate
              </p>
            </div>
            {!dashboardLoading && !dashboardError && (
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {overview.totalPendingTasks} open
              </span>
            )}
          </div>
          <div className="space-y-3">
            {sectionState("pending tasks", tasks)}
            {!dashboardLoading &&
              !dashboardError &&
              tasks.map((task) => (
                <article
                  key={task._id}
                  className="flex items-start gap-3 rounded-xl bg-brand-bg p-3.5"
                >
                  <span className="mt-0.5 text-brand-muted">
                    <Clock3 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {task.assignedTo?.fullName || "Unassigned"} · Due{" "}
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium capitalize text-brand-muted">
                    {task.priority}
                  </span>
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-brand-text">Upcoming meetings</h2>
            <p className="mt-1 text-sm text-brand-muted">
              {dashboardLoading
                ? "Loading meeting count…"
                : dashboardError
                  ? dashboardError
                  : `${overview.totalUpcomingMeetings} in your department or with you as a participant`}
            </p>
          </div>
          <CalendarDays className="text-brand-primary" size={19} />
        </div>
        {sectionState("upcoming meetings", meetings)}
        {!dashboardLoading && !dashboardError && meetings.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {meetings.map((meeting) => (
              <article key={meeting._id} className="rounded-xl bg-brand-bg p-4">
                <p className="text-sm font-medium text-brand-text">
                  {meeting.title}
                </p>
                <p className="mt-2 text-sm text-brand-primary">
                  {formatDate(meeting.startAt, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {formatTime(meeting.startAt)}
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  {meeting.departmentId?.name ||
                    meeting.description ||
                    "Department meeting"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
