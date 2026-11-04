import { useEffect, useState } from "react";
import { CalendarDays, Circle, FolderKanban } from "lucide-react";
import StatCard from "../../components/statcard";
import { api } from "../../services/api";

const stats = [
  {
    label: "Departments",
    key: "totalDepartments",
    color: "text-brand-primary",
  },
  {
    label: "Members",
    key: "totalMembers",
    color: "text-indigo-500",
  },
  {
    label: "Projects",
    key: "totalProjects",
    color: "text-emerald-500",
  },
  {
    label: "Upcoming Meetings",
    key: "totalUpcomingMeetings",
    color: "text-orange-500",
  },
];

const formatDate = (value, options = { month: "short", day: "2-digit" }) =>
  value
    ? new Date(value).toLocaleDateString(undefined, options)
    : "No date available";
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export default function TeamDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const overview = dashboard?.overview;
  const projects = dashboard?.data?.activeProjects ?? [];
  const tasks = dashboard?.data?.pendingTasks ?? [];
  const meetings = dashboard?.data?.upcomingMeetings ?? [];

  useEffect(() => {
    const controller = new AbortController();
    api
      .getTeamDashboard({ signal: controller.signal })
      .then((data) => {
        const requiredCounts = [
          "totalDepartments",
          "totalMembers",
          "totalProjects",
          "totalUpcomingMeetings",
          "totalPendingTasks",
        ];
        if (
          !data?.overview ||
          !requiredCounts.every((key) => Number.isFinite(data.overview[key]))
        ) {
          throw new Error("Statistics response is missing required counts.");
        }
        for (const key of [
          "activeProjects",
          "pendingTasks",
          "upcomingMeetings",
        ]) {
          if (!Array.isArray(data?.data?.[key])) {
            throw new Error(`Team dashboard response is missing ${key}.`);
          }
        }
        setDashboard(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDashboardError(error.message || "Unable to load team dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });

    return () => controller.abort();
  }, []);

  const sectionState = (label, values) => {
    if (dashboardLoading)
      return <p className="py-2 text-sm text-brand-muted">Loading {label}…</p>;
    if (dashboardError)
      return (
        <p role="alert" className="py-2 text-sm text-rose-700">
          {dashboardError}
        </p>
      );
    if (!values.length)
      return <p className="py-2 text-sm text-brand-muted">No {label} found.</p>;
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-primary">
            Team workspace
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Track active work and keep the team moving.
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Team statistics"
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            def={stat}
            stat={{ value: overview?.[stat.key] }}
            loading={dashboardLoading}
            error={dashboardError}
            showChange={false}
            showRing={false}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Active projects</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Projects underway in your scope
              </p>
            </div>
            <FolderKanban className="text-brand-primary" size={20} />
          </div>
          <div className="space-y-1">
            {sectionState("active projects", projects)}
            {!dashboardLoading &&
              !dashboardError &&
              projects.map((project) => (
                <article
                  key={project._id}
                  className="rounded-xl px-1 py-4 first:pt-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-brand-text">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-brand-muted">
                        {project.departmentId?.name || "No department linked"}
                        {" · "}Due {formatDate(project.endDate)}
                      </p>
                    </div>
                    {Number.isFinite(Number(project.progress)) && (
                      <span className="text-sm font-semibold text-brand-text">
                        {Number(project.progress)}%
                      </span>
                    )}
                  </div>
                  {Number.isFinite(Number(project.progress)) && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-primary"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(project.progress)))}%`,
                        }}
                      />
                    </div>
                  )}
                </article>
              ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Pending tasks</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Items that need a team follow-up
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
                  className="flex gap-3 rounded-xl bg-brand-bg p-3.5"
                >
                  <span className="mt-0.5 text-brand-muted">
                    <Circle size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {task.assignedTo?.fullName || "Assignee unavailable"}
                      {" · "}Due {formatDate(task.deadline)}
                    </p>
                  </div>
                  {task.priority && (
                    <span className="self-start rounded-md bg-white px-2 py-1 text-[11px] font-medium capitalize text-brand-muted">
                      {task.priority}
                    </span>
                  )}
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-brand-text">Upcoming meetings</h2>
            <p className="mt-1 text-sm text-brand-muted">
              {dashboardLoading
                ? "Loading meeting count…"
                : dashboardError
                  ? dashboardError
                  : `${overview.totalUpcomingMeetings} in your departments or with you as a participant`}
            </p>
          </div>
          <CalendarDays className="text-brand-primary" size={19} />
        </div>
        {sectionState("upcoming meetings", meetings)}
        {!dashboardLoading && !dashboardError && meetings.length > 0 && (
          <div className="space-y-3">
            <article className="rounded-xl border border-brand-border bg-brand-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Next team meeting
              </p>
              <p className="mt-2 text-sm font-medium text-brand-text">
                {meetings[0].title}
              </p>
              <p className="mt-2 text-sm text-brand-primary">
                {formatDate(meetings[0].startAt, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" · "}
                {formatTime(meetings[0].startAt)}
              </p>
              {(meetings[0].departmentId?.name ||
                meetings[0].department?.name ||
                meetings[0].description) && (
                <p className="mt-1 text-xs text-brand-muted">
                  {meetings[0].departmentId?.name ||
                    meetings[0].department?.name ||
                    meetings[0].description}
                </p>
              )}
              {meetings[0].meetingLink && (
                <a
                  className="mt-2 inline-block text-xs font-medium text-brand-primary underline"
                  href={meetings[0].meetingLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Meeting link
                </a>
              )}
            </article>
            {meetings.length > 1 && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {meetings.slice(1).map((meeting) => (
                  <article
                    key={meeting._id}
                    className="rounded-xl bg-brand-bg p-4"
                  >
                    <p className="text-sm font-medium text-brand-text">
                      {meeting.title}
                    </p>
                    <p className="mt-2 text-sm text-brand-primary">
                      {formatDate(meeting.startAt, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {formatTime(meeting.startAt)}
                    </p>
                    {(meeting.departmentId?.name ||
                      meeting.department?.name ||
                      meeting.description) && (
                      <p className="mt-1 text-xs text-brand-muted">
                        {meeting.departmentId?.name ||
                          meeting.department?.name ||
                          meeting.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
