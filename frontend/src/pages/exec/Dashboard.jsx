import { useEffect, useState } from "react";
import { CalendarDays, FileText, Users } from "lucide-react";
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

const statusLabels = {
  pending: "Pending",
  planned: "Planned",
  in_progress: "In progress",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

const statusColors = {
  pending: "bg-slate-100 text-slate-700",
  planned: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  "in-progress": "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  on_hold: "bg-amber-50 text-amber-700",
};

const formatDate = (value, options = { month: "short", day: "2-digit" }) =>
  value
    ? new Date(value).toLocaleDateString(undefined, options)
    : "No date available";

export default function ExecDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const overview = dashboard?.overview;
  const plans = dashboard?.data?.objectives ?? [];
  const departments = dashboard?.data?.departments ?? [];
  const meetings = dashboard?.data?.upcomingMeetings ?? [];

  useEffect(() => {
    const controller = new AbortController();
    api
      .getExecDashboard({ signal: controller.signal })
      .then((data) => {
        const requiredCounts = [
          "totalDepartments",
          "totalMembers",
          "totalProjects",
          "totalUpcomingMeetings",
        ];
        if (
          !data?.overview ||
          !requiredCounts.every((key) => Number.isFinite(data.overview[key]))
        ) {
          throw new Error("Statistics response is missing required counts.");
        }
        for (const key of ["objectives", "departments", "upcomingMeetings"]) {
          if (!Array.isArray(data?.data?.[key])) {
            throw new Error(`Executive dashboard response is missing ${key}.`);
          }
        }
        setDashboard(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDashboardError(
            error.message || "Unable to load executive dashboard.",
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
            Executive overview
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            A clear view of the association's priorities and progress.
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Organization statistics"
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

      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-brand-text">Upcoming meetings</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Key dates for the executive team
            </p>
          </div>
          <CalendarDays className="text-brand-primary" size={20} />
        </div>
        {sectionState("upcoming meetings", meetings)}
        {!dashboardLoading && !dashboardError && meetings.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                  })}
                  {" · "}
                  {formatDate(meeting.startAt, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {(meeting.departmentId?.name || meeting.description) && (
                  <p className="mt-1 text-xs text-brand-muted">
                    {meeting.departmentId?.name || meeting.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">Strategic plans</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Objectives from the objectives collection
              </p>
            </div>
            <FileText className="text-brand-primary" size={20} />
          </div>
          <div className="space-y-5">
            {sectionState("strategic plans", plans)}
            {!dashboardLoading &&
              !dashboardError &&
              plans.map((plan) => {
                const progress = Number(plan.progress);
                return (
                  <article key={plan._id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-brand-text">
                          {plan.title}
                        </p>
                        <p className="mt-1 text-xs text-brand-muted">
                          {plan.departmentId?.name || "No department linked"}
                          {" · "}
                          Due {formatDate(plan.weekEnd)}
                        </p>
                        {plan.description && (
                          <p className="mt-1 text-xs text-brand-muted">
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${statusColors[plan.status] || "bg-slate-100 text-slate-700"}`}
                      >
                        {statusLabels[plan.status] || plan.status}
                      </span>
                    </div>
                    {Number.isFinite(progress) && (
                      <>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-primary"
                            style={{
                              width: `${Math.max(0, Math.min(100, progress))}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-right text-xs text-brand-muted">
                          {progress}% complete
                        </p>
                      </>
                    )}
                  </article>
                );
              })}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">
                Departments overview
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Members and active projects by department
              </p>
            </div>
            <Users className="text-brand-primary" size={20} />
          </div>
          <div className="divide-y divide-brand-border">
            {sectionState("departments", departments)}
            {!dashboardLoading &&
              !dashboardError &&
              departments.map((department) => (
                <article key={department._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-text">
                        {department.name}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-muted">
                        {department.membersCount} members
                        {department.manager
                          ? ` · Manager: ${department.manager}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-brand-muted">
                      {department.projectsCount} projects (all statuses)
                    </span>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
