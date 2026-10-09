import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { Field, Select, TextInput, NumberInput } from "../../components/admin/FormField";

const COLUMNS = [
  {
    status: "todo",
    title: "To Do",
    dot: "bg-gray-400",
    bar: "border-t-gray-400",
    header: "from-gray-50 to-white",
    chip: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  },
  {
    status: "in-progress",
    title: "In Progress",
    dot: "bg-blue-500",
    bar: "border-t-blue-500",
    header: "from-blue-50 to-white",
    chip: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  },
  {
    status: "done",
    title: "Done",
    dot: "bg-emerald-500",
    bar: "border-t-emerald-500",
    header: "from-emerald-50 to-white",
    chip: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  },
];

const PRIO_STYLE = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  deadline: "",
  objectiveId: "",
  status: "todo",
};

export default function RespTasks() {
  const [tasks, setTasks] = useState([]);
  const [myMembers, setMyMembers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const loadOptions = async () => {
    try {
      const [members, objs] = await Promise.all([
        api.get("/members/search"),
        api.get("/objectives"),
      ]);
      setMyMembers(Array.isArray(members) ? members : []);
      setObjectives(Array.isArray(objs) ? objs : []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOptions(); }, []);

  const tasksFor = (status) => tasks.filter((t) => t.status === status);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      assignedTo: myMembers[0]?._id || "",
    });
    setFormOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title: t.title || "",
      description: t.description || "",
      assignedTo: t.assignedTo?._id || t.assignedTo || "",
      priority: t.priority || "medium",
      deadline: t.deadline ? t.deadline.slice(0, 10) : "",
      objectiveId: t.objectiveId?._id || t.objectiveId || "",
      status: t.status || "todo",
    });
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (!form.assignedTo) {
      toast.error("Please choose a member to assign.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
        priority: form.priority,
        deadline: form.deadline
          ? new Date(form.deadline).toISOString()
          : null,
        objectiveId: form.objectiveId || null,
        status: form.status,
      };
      if (editing) {
        await api.patch(`/tasks/${editing._id}`, payload);
        toast.success("Task updated");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task, status) => {
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status } : t))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${confirmDelete._id}`);
      toast.success("Task deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderCard = (t) => (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-brand-text leading-snug">
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
  <span>{t.assignedTo?.fullName || "—"}</span>
  {t.deadline && (
    <>
      {" • "}
      <span className="text-red-600 font-medium">
        {format(parseISO(t.deadline), "d MMM", { locale: fr })}
      </span>
    </>
  )}
</div>
      {t.objectiveId && (
        <div className="text-[11px] text-brand-muted truncate">
          Objective: {t.objectiveId.title}
        </div>
      )}
      <div className="flex items-center gap-2 mt-1">
        <Select
          value={t.status}
          onChange={(e) => changeStatus(t, e.target.value)}
          className="text-xs"
        >
          {COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>{c.title}</option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => openEdit(t)}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-brand-primary bg-blue-50 hover:bg-blue-100"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(t)}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Task Board"
        subtitle="Assign and track your members' tasks."
        onAdd={openAdd}
        addLabel="New Task"
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
      className={`rounded-2xl border border-brand-border border-t-4 ${col.bar} bg-brand-bg/40 p-3 min-h-[320px] flex flex-col gap-3`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r ${col.header} border border-brand-border`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <span className={`w-2 h-2 rounded-full ${col.dot}`} />
          {col.title}
        </span>
        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${col.chip}`}>
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

      <Drawer
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? "Edit Task" : "New Task"}
        subtitle={editing ? editing.title : "Assign a task to a member"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="task-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Update the event poster"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Assigned to" required>
              <Select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
              >
                <option value="">Choose a member...</option>
                {myMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.fullName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Deadline">
              <input
                type="date"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
              />
            </Field>
            <Field label="Objective (optional)">
              <Select
                value={form.objectiveId}
                onChange={(e) =>
                  setForm({ ...form, objectiveId: e.target.value })
                }
              >
                <option value="">No objective</option>
                {objectives.map((o) => (
                  <option key={o._id} value={o._id}>{o.title}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Column">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {COLUMNS.map((c) => (
                <option key={c.status} value={c.status}>{c.title}</option>
              ))}
            </Select>
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete task?"
        message={
          confirmDelete
            ? `"${confirmDelete.title}" will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}