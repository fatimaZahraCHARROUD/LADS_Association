import { useState } from "react";
import {
  Layers, Plus, Trash2, X, Users, ListChecks, CheckCircle2, UserCircle2, Pencil, CalendarDays,
} from "lucide-react";
import { Avatar, StatusBadge, STATUS, idOf } from "./projectUi";
import { displayName, formatDate, isOverdue, toInputDate } from "../../services/projectWorkApi";

const field =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className={`rounded-lg p-2 ${color}`}><Icon size={18} /></span>
      <div>
        <p className="text-xl font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MemberPicker({ people, value, onChange }) {
  const valStrs = (value || []).map(idOf).filter(Boolean);
  const toggle = (id) => {
    const sid = idOf(id);
    onChange(valStrs.includes(sid) ? valStrs.filter((x) => x !== sid) : [...valStrs, sid]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {people.map((u) => {
        const uid = idOf(u);
        const on = valStrs.includes(uid);
        return (
          <button type="button" key={uid} onClick={() => toggle(uid)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}>
            {displayName(u)}
          </button>
        );
      })}
    </div>
  );
}

function CelluleForm({ people, initial, title, submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [members, setMembers] = useState((initial?.members || []).map(idOf));
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const ok = await onSubmit({ name: name.trim(), description, members });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white"><X size={18} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex : Quran)" className={field} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className={field} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Membres de la cellule</p>
        <MemberPicker people={people} value={members} onChange={setMembers} />
      </div>
      <button disabled={busy || !name.trim()}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
        {submitLabel}
      </button>
    </form>
  );
}

function TaskForm({ members, onSubmit }) {
  const empty = { title: "", description: "", assignee: "", dueDate: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (members.length === 0) {
    return (
      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Ajoute d'abord des membres à cette cellule pour pouvoir leur assigner des tâches.
      </p>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.assignee) return;
    setBusy(true);
    const ok = await onSubmit({ ...f, title: f.title.trim() });
    setBusy(false);
    if (ok) setF(empty);
  };

  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-12">
      <input value={f.title} onChange={set("title")} placeholder="Nouvelle tâche…" className={`${field} sm:col-span-5`} />
      <select value={f.assignee} onChange={set("assignee")} className={`${field} sm:col-span-3`}>
        <option value="">Assigner à…</option>
        {members.map((m) => {
          const mid = idOf(m);
          return <option key={mid} value={mid}>{displayName(m)}</option>;
        })}
      </select>
      <input type="date" value={f.dueDate} onChange={set("dueDate")} className={`${field} sm:col-span-2`} title="Échéance (facultative)" />
      <button disabled={busy || !f.title.trim() || !f.assignee}
        className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 sm:col-span-2">
        <Plus size={15} /> Ajouter
      </button>
      <input value={f.description} onChange={set("description")} placeholder="Description (facultative)" className={`${field} sm:col-span-12`} />
    </form>
  );
}

function TaskItem({ task, cellMembers, onStatusChange, onUpdateTask, onDeleteTask }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(null);
  const overdue = isOverdue(task);

  const start = () => {
    setF({
      title: task.title,
      description: task.description || "",
      assignedTo: idOf(task.assignee),
      status: task.status,
      dueDate: toInputDate(task.dueDate),
    });
    setEditing(true);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    const ok = await onUpdateTask(task._id, {
      title: f.title.trim(),
      description: f.description,
      assignedTo: f.assignedTo,
      status: f.status,
      dueDate: f.dueDate || null, // null = supprimer l'échéance
    });
    if (ok) setEditing(false);
  };

  if (editing) {
    return (
      <li className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={f.title} onChange={set("title")} placeholder="Titre" className={field} />
          <input value={f.description} onChange={set("description")} placeholder="Description" className={field} />
          <select value={f.assignedTo} onChange={set("assignedTo")} className={field}>
            {cellMembers.map((m) => {
              const mid = idOf(m);
              return <option key={mid} value={mid}>{displayName(m)}</option>;
            })}
          </select>
          <input type="date" value={f.dueDate} onChange={set("dueDate")} className={field} />
          <select value={f.status} onChange={set("status")} className={field}>
            {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button disabled={!f.title.trim() || !f.assignedTo} onClick={save}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            Enregistrer
          </button>
          <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-white">
            Annuler
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-800"}`}>
          {task.title}
        </p>
        {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><UserCircle2 size={12} /> {displayName(task.assignee)}</span>
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? "font-medium text-red-600" : ""}`}>
              <CalendarDays size={12} /> {formatDate(task.dueDate)}{overdue && " · en retard"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={task.status} />
        <select value={task.status} onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500">
          {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
        <button onClick={start} title="Modifier la tâche"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={14} /></button>
        <button onClick={() => onDeleteTask(task._id)} title="Supprimer la tâche"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
      </div>
    </li>
  );
}

function CelluleCard({ cellule, people, h }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CelluleForm
        people={people}
        title="Modifier la cellule"
        submitLabel="Enregistrer"
        initial={{
          name: cellule.name,
          description: cellule.description || "",
          members: cellule.members.map(idOf),
        }}
        onSubmit={(d) => h.onUpdateCellule(cellule._id, d)}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Layers size={18} /></span>
          <div>
            <h4 className="font-semibold text-slate-900">{cellule.name}</h4>
            {cellule.description && <p className="text-sm text-slate-500">{cellule.description}</p>}
          </div>
        </div>
        <div className="flex">
          <button onClick={() => setEditing(true)} title="Modifier la cellule"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"><Pencil size={16} /></button>
          <button onClick={() => h.onDeleteCellule(cellule._id)} title="Supprimer la cellule"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="mt-4 flex -space-x-2">
        {cellule.members.length
          ? cellule.members.map((m) => <Avatar key={idOf(m)} user={m} />)
          : <span className="text-xs text-slate-400">Aucun membre dans cette cellule</span>}
      </div>

      <ul className="mt-4 space-y-2">
        {cellule.tasks.map((t) => (
          <TaskItem key={t._id} task={t} cellMembers={cellule.members}
            onStatusChange={h.onStatusChange} onUpdateTask={h.onUpdateTask} onDeleteTask={h.onDeleteTask} />
        ))}
        {!cellule.tasks.length && <p className="text-sm text-slate-400">Aucune tâche pour l'instant.</p>}
      </ul>

      <TaskForm members={cellule.members} onSubmit={(d) => h.onAddTask(cellule._id, d)} />
    </article>
  );
}

export default function ResponsableProjects({
  projects = [], loading,
  onAddCellule, onUpdateCellule, onDeleteCellule,
  onAddTask, onUpdateTask, onDeleteTask, onStatusChange,
}) {
  const [openForm, setOpenForm] = useState(null); // id du projet dont le formulaire est ouvert
  const h = { onAddCellule, onUpdateCellule, onDeleteCellule, onAddTask, onUpdateTask, onDeleteTask, onStatusChange };

  if (loading) return <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mes projets</h1>
        <p className="mt-1 text-sm text-slate-500">Gère ton équipe, tes cellules et les tâches de chaque membre.</p>
      </header>

      {projects.map((p) => {
        const team = [...p.managers, ...p.members].filter(
          (u, i, a) => a.findIndex((x) => idOf(x) === idOf(u)) === i
        );
        const isManager = (u) => p.managers.some((m) => idOf(m) === idOf(u));
        const tasks = p.cellules.flatMap((c) => c.tasks);
        const done = tasks.filter((t) => t.status === "completed").length;

        return (
          <section key={p._id} className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 p-6 text-white shadow-lg">
              <h2 className="text-2xl font-bold">{p.name}</h2>
              {p.description && <p className="mt-1 max-w-2xl text-sm text-blue-100">{p.description}</p>}
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {team.map((u) => <Avatar key={idOf(u)} user={u} crown={isManager(u)} />)}
                </div>
                <span className="text-sm text-blue-100">{team.length} personne(s) dans l'équipe</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={Users} label="Membres" value={p.members.length} color="bg-blue-50 text-blue-600" />
              <Stat icon={Layers} label="Cellules" value={p.cellules.length} color="bg-indigo-50 text-indigo-600" />
              <Stat icon={ListChecks} label="Tâches" value={tasks.length} color="bg-amber-50 text-amber-600" />
              <Stat icon={CheckCircle2} label="Terminées" value={done} color="bg-emerald-50 text-emerald-600" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-slate-800">Équipe du projet</h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((u) => {
                  const uid = idOf(u);
                  return (
                    <li key={uid} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <Avatar user={u} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{displayName(u)}</p>
                        <p className="text-xs text-slate-500">{isManager(u) ? "Responsable" : "Membre"}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Cellules</h3>
              {openForm !== p._id && (
                <button onClick={() => setOpenForm(p._id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  <Plus size={16} /> Nouvelle cellule
                </button>
              )}
            </div>

            {openForm === p._id && (
              <CelluleForm
                people={team}
                title="Nouvelle cellule"
                submitLabel="Ajouter la cellule"
                onSubmit={(d) => onAddCellule(p._id, d)}
                onClose={() => setOpenForm(null)}
              />
            )}

            {p.cellules.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
                Aucune cellule pour ce projet.
              </p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {p.cellules.map((c) => <CelluleCard key={c._id} cellule={c} people={team} h={h} />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
