import { FolderKanban, Layers, CalendarDays } from "lucide-react";
import { StatusBadge, STATUS } from "./projectUi";
import { formatDate, isOverdue } from "../../services/projectWorkApi";

function TaskRow({ task, onStatusChange }) {
  const overdue = isOverdue(task);
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={`font-medium ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-800"}`}>
          {task.title}
        </p>
        {task.description && <p className="mt-0.5 text-sm text-slate-500">{task.description}</p>}
        {task.dueDate && (
          <p className={`mt-1 flex items-center gap-1 text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
            <CalendarDays size={12} /> {formatDate(task.dueDate)}{overdue && " · en retard"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={task.status} />
        <select
          value={task.status}
          onChange={(e) => onStatusChange?.(task._id, e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {Object.entries(STATUS).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
      </div>
    </li>
  );
}

export default function MemberProjects({ projects = [], onStatusChange, loading, showHeader = true }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {showHeader && (
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes projets</h1>
          <p className="mt-1 text-sm text-slate-500">Retrouve tes cellules et les tâches qui te sont assignées.</p>
        </header>
      )}

      {projects.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600"><FolderKanban size={28} /></div>
          <p className="font-semibold text-slate-800">Aucun projet pour le moment</p>
          <p className="mt-1 text-sm text-slate-500">Tu apparaîtras ici dès que tu seras ajouté à un projet.</p>
        </div>
      )}

      {projects.map((p) => {
        const allTasks = p.cellules.flatMap((c) => c.tasks);
        const done = allTasks.filter((t) => t.status === "completed").length;
        const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

        return (
          <section key={p._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  {p.description && <p className="mt-1 max-w-2xl text-sm text-blue-100">{p.description}</p>}
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
                  <p className="text-2xl font-bold leading-none">{pct}%</p>
                  <p className="text-[11px] uppercase tracking-wide text-blue-100">avancement</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-blue-100">
                {done}/{allTasks.length} tâches terminées · {p.cellules.length} cellule(s)
              </p>
            </div>

            <div className="space-y-6 p-6">
              {p.cellules.length === 0 && (
                <p className="text-sm text-slate-500">Tu n'es encore dans aucune cellule de ce projet.</p>
              )}
              {p.cellules.map((c) => (
                <div key={c._id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600"><Layers size={16} /></span>
                    <h3 className="font-semibold text-slate-800">Cellule {c.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {c.tasks.length} tâche(s)
                    </span>
                  </div>
                  {c.tasks.length ? (
                    <ul className="space-y-2">
                      {c.tasks.map((t) => <TaskRow key={t._id} task={t} onStatusChange={onStatusChange} />)}
                    </ul>
                  ) : (
                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Aucune tâche ne t'est assignée dans cette cellule.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}