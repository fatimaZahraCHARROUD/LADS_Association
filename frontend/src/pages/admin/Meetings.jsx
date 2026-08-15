import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, getCurrentUserId } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import { Field, Select } from "../../components/admin/FormField";

const EMPTY_MEETING = {
  title: "",
  description: "",
  department: "",
  startAt: "",
  endAt: "",
  meetingLink: "",
  status: "scheduled",
};

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "ongoing") return "ongoing";
  if (status === "cancelled") return "draft";
  return "upcoming";
}

export default function AdminMeetings() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MEETING);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsMeeting, setDetailsMeeting] = useState(null);

  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const load = async () => {
    setLoading(true);
    try {
      const from = weekStart.toISOString();
      const to = weekEnd.toISOString();
      const data = await api.get(
        `/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [weekStart]);

  const meetingsForDay = (day) =>
    meetings.filter((m) => isSameDay(parseISO(m.startAt), day));

  const openCreate = (day) => {
    setEditing(null);
    setForm({
      ...EMPTY_MEETING,
      startAt: toLocalInputValue(day || new Date()),
      endAt: toLocalInputValue(day || new Date()),
    });
    setDrawerOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      title: m.title || "",
      description: m.description || "",
      department: m.department?._id || m.department || "",
      startAt: toLocalInputValue(m.startAt),
      endAt: toLocalInputValue(m.endAt),
      meetingLink: m.meetingLink || "",
      status: m.status || "scheduled",
    });
    setDrawerOpen(true);
    setDetailsMeeting(null);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.department.trim()) {
      toast.error("Department ID is required.");
      return;
    }
    if (!form.startAt || !form.endAt) {
      toast.error("Start and end time are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        createdBy: getCurrentUserId(),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      };
      if (editing) {
        await api.patch(`/meetings/${editing._id}`, payload);
        toast.success("Meeting updated");
      } else {
        await api.post("/meetings", payload);
        toast.success("Meeting created");
      }
      setDrawerOpen(false);
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
      await api.delete(`/meetings/${confirmDelete._id}`);
      toast.success("Meeting deleted");
      setConfirmDelete(null);
      setDetailsMeeting(null);
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
        title="Meetings"
        subtitle="Weekly view of department meetings."
        onAdd={() => openCreate(new Date())}
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

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="min-h-[220px] rounded-xl border border-brand-border bg-white p-2 flex flex-col"
          >
            <button
              onClick={() => openCreate(day)}
              className="text-left mb-2 group"
            >
              <div className="text-xs text-brand-muted uppercase">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div className="text-sm font-semibold text-brand-text group-hover:text-brand-primary">
                {format(day, "d MMM", { locale: fr })}
              </div>
            </button>

            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {loading ? (
                <div className="text-xs text-brand-muted">…</div>
              ) : (
                meetingsForDay(day).map((m) => (
                  <button
                    key={m._id}
                    onClick={() => setDetailsMeeting(m)}
                    className="w-full text-left px-2 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
                  >
                    <div className="text-xs font-medium text-brand-text truncate">
                      {format(parseISO(m.startAt), "HH:mm")} — {m.title}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Meeting details drawer */}
      {detailsMeeting && (
        <Drawer
          open={!!detailsMeeting}
          onClose={() => setDetailsMeeting(null)}
          title={detailsMeeting.title}
          subtitle={`${format(
            parseISO(detailsMeeting.startAt),
            "EEEE d MMM, HH:mm",
            { locale: fr }
          )} – ${format(parseISO(detailsMeeting.endAt), "HH:mm")}`}
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(detailsMeeting)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => openEdit(detailsMeeting)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover"
              >
                Edit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <StatusBadge variant={statusVariant(detailsMeeting.status)}>
              {detailsMeeting.status}
            </StatusBadge>

            {detailsMeeting.description && (
              <p className="text-sm text-brand-muted">
                {detailsMeeting.description}
              </p>
            )}

            {detailsMeeting.meetingLink && (
              <a
                href={detailsMeeting.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-primary underline block"
              >
                Join meeting
              </a>
            )}
          </div>
        </Drawer>
      )}

      {/* Create / edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit meeting" : "New meeting"}
        subtitle={editing ? editing.title : "Schedule a new meeting"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="meeting-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="meeting-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <input
              type="text"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>

          <Field label="Department ID" required>
            <input
              type="text"
              placeholder="ObjectId du département"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" required>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </Field>
            <Field label="End" required>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Meeting link">
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete meeting?"
        message={
          confirmDelete
            ? `"${confirmDelete.title}" will be permanently removed. This action cannot be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}
