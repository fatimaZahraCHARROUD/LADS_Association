import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import { Field, Select, TextInput, NumberInput } from "../../components/admin/FormField";

function toInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "pending") return "draft";
  return "upcoming";
}

// Page "Objectives" du Responsable :
// il pose les objectifs de la semaine de SES cellules/départements.
export default function RespObjectives() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myDepts, setMyDepts] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    weekStart: toInputDate(new Date()),
    weekEnd: toInputDate(new Date()),
    target: "",
    achievement: "",
    status: "in-progress",
    departmentId: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/objectives");
      setObjectives(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDepts = async () => {
    try {
      const list = await api.get("/cellules");
      const map = new Map();
      (Array.isArray(list) ? list : []).forEach((c) => {
        const d = c.departmentId;
        if (d?._id) map.set(d._id, d.name);
      });
      setMyDepts([...map.entries()].map(([value, name]) => ({ value, name })));
    } catch {
      setMyDepts([]);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadDepts(); }, []);

  // Objectifs de LA SEMAINE affichée (filtrage côté client)
  const weekObjectives = useMemo(() => {
    const wStart = weekStart.getTime();
    const wEnd = weekEnd.getTime();
    return objectives.filter((o) => {
      const t = parseISO(o.weekStart).getTime();
      return t >= wStart && t <= wEnd;
    });
  }, [objectives, weekStart, weekEnd]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      weekStart: toInputDate(weekStart),
      weekEnd: toInputDate(weekStart),
      target: "",
      achievement: "",
      status: "in-progress",
      departmentId: myDepts[0]?.value || "",
    });
    setFormOpen(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({
      title: o.title || "",
      description: o.description || "",
      weekStart: toInputDate(o.weekStart),
      weekEnd: toInputDate(o.weekEnd),
      target: String(o.target ?? ""),
      achievement: String(o.achievement ?? ""),
      status: o.status || "in-progress",
      departmentId: o.departmentId?._id || o.departmentId || "",
    });
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.weekStart || !form.weekEnd) {
      toast.error("Week start and end are required.");
      return;
    }
    if (!form.departmentId) {
      toast.error("Please choose a department.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        weekStart: new Date(form.weekStart).toISOString(),
        weekEnd: new Date(form.weekEnd).toISOString(),
        target: Number(form.target) || 0,
        achievement: Number(form.achievement) || 0,
        status: form.status,
        departmentId: form.departmentId,
      };
      if (editing) {
        await api.patch(`/objectives/${editing._id}`, payload);
        toast.success("Objective updated");
      } else {
        await api.post("/objectives", payload);
        toast.success("Objective created");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/objectives/${confirmDelete._id}`);
      toast.success("Objective deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Objectives"
        subtitle="Weekly objectives for your cellules."
        onAdd={openAdd}
        addLabel="New Objective"
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekStart((d) => subWeeks(d, 1))}
          className="p-2 rounded-lg border border-brand-border hover:bg-gray-50"
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-medium text-brand-text">
          {format(weekStart, "d MMM", { locale: fr })} –{" "}
          {format(weekEnd, "d MMM yyyy", { locale: fr })}
        </div>
        <button
          onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          className="p-2 rounded-lg border border-brand-border hover:bg-gray-50"
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* List of the week's objectives */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center text-brand-muted">
            Loading...
          </div>
        ) : weekObjectives.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center text-brand-muted">
            No objectives for this week.
          </div>
        ) : (
          weekObjectives.map((o) => {
            const progress = Math.min(100, Math.max(0, o.progress || 0));
            return (
              <div
                key={o._id}
                className="bg-white rounded-2xl border border-brand-border p-5 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-brand-text">{o.title}</span>
                    <StatusBadge variant={statusVariant(o.status)}>
                      {o.status}
                    </StatusBadge>
                    <span className="text-xs text-brand-muted">
                      {o.departmentId?.name || "—"}
                    </span>
                  </div>
                  {o.description && (
                    <p className="text-sm text-brand-muted mt-1 line-clamp-2">
                      {o.description}
                    </p>
                  )}
                  <div className="text-xs text-brand-muted mt-1">
                    {format(parseISO(o.weekStart), "d MMM", { locale: fr })} →{" "}
                    {format(parseISO(o.weekEnd), "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-brand-muted whitespace-nowrap">
                      {o.achievement ?? 0} / {o.target ?? 0} ({progress}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(o)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-primary bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(o)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / edit drawer */}
      <Drawer
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? "Edit Objective" : "New Objective"}
        subtitle={editing ? editing.title : "Set a weekly objective"}
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
              form="objective-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="objective-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Recruit 10 new members"
            />
          </Field>

          <Field label="Department" required>
            <Select
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
            >
              <option value="">Choose a department...</option>
              {myDepts.map((d) => (
                <option key={d.value} value={d.value}>{d.name}</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Week start" required>
              <input
                type="date"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                value={form.weekStart}
                onChange={(e) =>
                  setForm({ ...form, weekStart: e.target.value })
                }
              />
            </Field>
            <Field label="Week end" required>
              <input
                type="date"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                value={form.weekEnd}
                onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Target (number)">
              <NumberInput
                min={0}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="e.g. 10"
              />
            </Field>
            <Field label="Achieved">
              <NumberInput
                min={0}
                value={form.achievement}
                onChange={(e) =>
                  setForm({ ...form, achievement: e.target.value })
                }
                placeholder="e.g. 4"
              />
            </Field>
          </div>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
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

          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <CheckCircle2 size={14} />
            Progress = achieved / target × 100 (calculated automatically).
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete objective?"
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