import { useEffect, useState } from "react";
import {
  CalendarDays,
  Circle,
  Clock3,
  FileText,
  MapPin,
  UserRound,
} from "lucide-react";
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
const weekRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatDate(start)} – ${formatDate(end)}`;
};

export default function MemberDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const user = dashboard?.user;
  const overview = dashboard?.overview;
  const tasks = dashboard?.data?.tasks ?? [];
  const weekly = dashboard?.data?.thisWeek ?? { tasks: [], objectives: [] };
  const meetings = dashboard?.data?.upcomingMeetings ?? [];
  const departments = dashboard?.data?.departments ?? [];
  const pendingTasks = tasks.filter((task) => task.status !== "done");

  useEffect(() => {
    const controller = new AbortController();
    api
      .getMemberDashboard({ signal: controller.signal })
      .then((data) => {
        if (
          !data?.user ||
          !data?.overview ||
          !Array.isArray(data?.data?.tasks) ||
          !Array.isArray(data?.data?.thisWeek?.tasks) ||
          !Array.isArray(data?.data?.thisWeek?.objectives) ||
          !Array.isArray(data?.data?.upcomingMeetings) ||
          !Array.isArray(data?.data?.departments)
        ) {
          throw new Error("Member dashboard response is incomplete.");
        }
        setDashboard(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDashboardError(error.message || "Unable to load your dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });

    api
      .getMemberDocuments({ signal: controller.signal })
      .then((data) => {
        if (!Array.isArray(data))
          throw new Error("Documents response is not a list.");
        setDocuments(data.slice(0, 5));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDocumentsError(error.message || "Unable to load your documents.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDocumentsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-primary">
              Week of {weekRange()}
            </p>
            {dashboardLoading && (
              <h1 className="mt-2 text-2xl font-bold text-brand-text">
                Loading your dashboard…
              </h1>
            )}
            {dashboardError && (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                {dashboardError}
              </p>
            )}
            {!dashboardLoading && !dashboardError && (
              <>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-brand-text">
                  Welcome back, {user.fullName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
                  You have {overview.totalPendingTasks} open tasks and{" "}
                  {overview.totalUpcomingMeetings} upcoming meetings. Thanks for
                  helping the community move forward.
                </p>
              </>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand-primary">
            <UserRound size={23} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-border pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-brand-muted">My tasks</p>
            <p className="mt-1 text-lg font-semibold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalPendingTasks}{" "}
              <span className="text-xs font-normal text-brand-muted">open</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Completed</p>
            <p className="mt-1 text-lg font-semibold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalCompletedTasks}{" "}
              <span className="text-xs font-normal text-brand-muted">
                all time
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Meetings</p>
            <p className="mt-1 text-lg font-semibold text-brand-text">
              {dashboardLoading
                ? "…"
                : dashboardError
                  ? "—"
                  : overview.totalUpcomingMeetings}{" "}
              <span className="text-xs font-normal text-brand-muted">
                upcoming
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Team</p>
            {dashboardLoading && (
              <p className="mt-1 text-sm text-brand-muted">Loading…</p>
            )}
            {dashboardError && (
              <p role="alert" className="mt-1 text-xs text-rose-700">
                {dashboardError}
              </p>
            )}
            {!dashboardLoading && !dashboardError && (
              <p className="mt-1 truncate text-sm font-semibold text-brand-text">
                {departments.length
                  ? departments.map((department) => department.name).join(", ")
                  : "No department"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-text">My tasks</h2>
              <p className="mt-1 text-sm text-brand-muted">
                A short list of what's on your plate
              </p>
            </div>
            {!dashboardLoading && !dashboardError && (
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand-primary">
                {pendingTasks.length} open
              </span>
            )}
          </div>
          <div className="space-y-3">
            {dashboardLoading && (
              <p className="text-sm text-brand-muted">Loading your tasks…</p>
            )}
            {dashboardError && (
              <p role="alert" className="text-sm text-rose-700">
                {dashboardError}
              </p>
            )}
            {!dashboardLoading && !dashboardError && tasks.length === 0 && (
              <p className="text-sm text-brand-muted">
                No tasks assigned to you.
              </p>
            )}
            {!dashboardLoading &&
              !dashboardError &&
              tasks.map((task) => (
                <article
                  key={task._id}
                  className="flex gap-3 rounded-xl border border-brand-border p-3.5 sm:p-4"
                >
                  <span className="mt-0.5 text-brand-muted" aria-hidden="true">
                    {task.status === "in-progress" ? (
                      <Clock3 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {task.departmentId?.name || "No department"}
                      {" · "}Due {formatDate(task.deadline)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 self-start rounded-md px-2 py-1 text-[11px] font-medium ${task.status === "done" ? "bg-emerald-50 text-emerald-700" : task.status === "in-progress" ? "bg-blue-50 text-brand-primary" : "bg-amber-50 text-amber-700"}`}
                  >
                    {task.status}
                  </span>
                </article>
              ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="text-brand-primary" size={19} />
            <div>
              <h2 className="font-semibold text-brand-text">
                Upcoming meetings
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Meetings for you or your departments
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {dashboardLoading && (
              <p className="text-sm text-brand-muted">Loading your meetings…</p>
            )}
            {dashboardError && (
              <p role="alert" className="text-sm text-rose-700">
                {dashboardError}
              </p>
            )}
            {!dashboardLoading && !dashboardError && meetings.length === 0 && (
              <p className="text-sm text-brand-muted">No upcoming meetings.</p>
            )}
            {!dashboardLoading &&
              !dashboardError &&
              meetings.map((meeting) => (
                <article
                  key={meeting._id}
                  className="flex gap-3 rounded-xl bg-brand-bg p-3.5"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-brand-primary">
                    <span className="text-base font-bold leading-4">
                      {formatDate(meeting.startAt, { day: "2-digit" })}
                    </span>
                    <span className="mt-1 text-[9px] font-semibold tracking-wide">
                      {formatDate(meeting.startAt, {
                        month: "short",
                      }).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text">
                      {meeting.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {formatTime(meeting.startAt)} –{" "}
                      {formatTime(meeting.endAt)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-brand-muted">
                      <MapPin size={12} />{" "}
                      {meeting.departmentId?.name ||
                        meeting.description ||
                        "Association meeting"}
                    </p>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">This week</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Tasks due this week and linked weekly objectives
              </p>
            </div>
            <Clock3 className="text-brand-primary" size={19} />
          </div>
          {dashboardLoading && (
            <p className="text-sm text-brand-muted">
              Loading this week's focus…
            </p>
          )}
          {dashboardError && (
            <p role="alert" className="text-sm text-rose-700">
              {dashboardError}
            </p>
          )}
          {!dashboardLoading &&
            !dashboardError &&
            weekly.tasks.length === 0 &&
            weekly.objectives.length === 0 && (
              <p className="text-sm text-brand-muted">
                Nothing scheduled for this week.
              </p>
            )}
          {!dashboardLoading && !dashboardError && (
            <div className="space-y-3">
              {weekly.objectives.map((objective) => (
                <article
                  key={objective._id}
                  className="rounded-xl bg-brand-bg p-3.5"
                >
                  <p className="text-sm font-medium text-brand-text">
                    {objective.title}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {objective.departmentId?.name || "Weekly objective"} ·{" "}
                    {Number(objective.progress) || 0}% complete
                  </p>
                </article>
              ))}
              {weekly.tasks.map((task) => (
                <article
                  key={task._id}
                  className="rounded-xl border border-brand-border p-3.5"
                >
                  <p className="text-sm font-medium text-brand-text">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    Due {formatDate(task.deadline)} · {task.status}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-brand-text">
                Recent documents
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Resources visible to your account
              </p>
            </div>
            <FileText className="text-brand-primary" size={19} />
          </div>
          <div className="divide-y divide-brand-border">
            {documentsLoading && (
              <p className="py-3 text-sm text-brand-muted">
                Loading documents…
              </p>
            )}
            {documentsError && (
              <p role="alert" className="py-3 text-sm text-rose-700">
                {documentsError}
              </p>
            )}
            {!documentsLoading && !documentsError && documents.length === 0 && (
              <p className="py-3 text-sm text-brand-muted">
                No documents are shared with you.
              </p>
            )}
            {!documentsLoading &&
              !documentsError &&
              documents.map((document) => (
                <article
                  key={document._id}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold uppercase text-blue-700">
                    {document.category || "DOC"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-text">
                      {document.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {document.description ||
                        document.category ||
                        "Shared document"}{" "}
                      · Updated{" "}
                      {formatDate(document.updatedAt ?? document.createdAt)}
                    </p>
                  </div>
                  <FileText
                    className="ml-auto shrink-0 text-brand-muted"
                    size={16}
                  />
                </article>
              ))}
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="text-brand-primary" size={19} />
          <h2 className="font-semibold text-brand-text">
            Personal information
          </h2>
        </div>
        {dashboardLoading && (
          <p className="text-sm text-brand-muted">Loading your profile…</p>
        )}
        {dashboardError && (
          <p role="alert" className="text-sm text-rose-700">
            {dashboardError}
          </p>
        )}
        {!dashboardLoading && !dashboardError && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-xs text-brand-muted">Full name</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text">
                {user.fullName || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">Email</dt>
              <dd className="mt-1 break-all text-sm font-medium text-brand-text">
                {user.email || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">Department</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text">
                {departments.map((department) => department.name).join(", ") ||
                  "No department"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-muted">Member since</dt>
              <dd className="mt-1 text-sm font-medium text-brand-text">
                {user.dateAdhesion || "Not provided"}
              </dd>
            </div>
          </dl>
        )}
      </aside>
    </div>
  );
}
