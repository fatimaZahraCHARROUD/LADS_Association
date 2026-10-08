import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { api, getCurrentUserId } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import { Select } from "../../components/admin/FormField";

const COLUMNS = [
  { status: "todo", title: "To Do", accent: "bg-slate-500" },
  { status: "in-progress", title: "In Progress", accent: "bg-blue-500" },
  { status: "done", title: "Done", accent: "bg-emerald-500" },
];

const PRIO_STYLE = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

// Page "Tasks" du Membre :
// il peut changer le statut de SES tâches uniquement ;
// toutes les autres tâches sont affichées en GRIS (lecture seule).
export default function MemberTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const myId = getCurrentUserId();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const isMine = (t) =>
    String(t.assignedTo?._id || t.assignedTo) === String(myId);

  const tasksFor = (status) =>
    tasks.filter((t) => t.status === status);

  const changeStatus = async (task, status) => {
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status } : t))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderCard = (t) => {
    const mine = isMine(t);
    return (
      <div
        className={`rounded-xl border border-brand-border shadow-sm p-3 flex flex-col gap-2 transition-opacity ${
          mine ? "bg-white" : "bg-gray-50 opacity-70"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={`text-sm font-medium leading-snug ${
              mine ? "text-brand-text" : "text-gray-500"
            }`}
          >
            {t.title}
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${PRIO_STYLE[t.priority] || PRIO_STYLE.medium}`}
          >
            <Flag size={10} />
            {t.priority}
          </span>
        </div>

        {t.description && (
          <p className="text-xs text-brand-muted line-clamp-2">{t.description}</p>
        )}

        <div className="text-[11px] text-brand-muted">
          {t.assignedTo?.fullName || "—"}
          {t.deadline && ` • ${format(parseISO(t.deadline), "d MMM", { locale: fr })}`}
        </div>

        {mine ? (
          <div className="flex items-center gap-2 mt-1">
            <Select
              value={t.status}
              onChange={(e) => changeStatus(t, e.target.value)}
              className="text-xs"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </Select>
            <span className="ml-auto text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              Yours
            </span>
          </div>
        ) : (
          <div className="text-[11px] italic text-gray-400 mt-1">
            Read-only (assigned to someone else)
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Task Board"
        subtitle="Update YOUR tasks — the others are read-only."
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-border p-10 text-center text-brand-muted">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className="rounded-2xl border border-brand-border bg-brand-bg/40 p-3 min-h-[300px] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-brand-text">
                  <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                  {col.title}
                </span>
                <span className="text-xs text-brand-muted bg-white rounded-full px-2 py-0.5 border border-brand-border">
                  {tasksFor(col.status).length}
                </span>
              </div>
              {tasksFor(col.status).map((t) => (
                <div key={t._id}>{renderCard(t)}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}