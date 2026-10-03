import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import RowActions from "../../components/admin/RowActions";
import { Field, TextInput, DateInput, Select } from "../../components/admin/FormField";

const EMPTY_PLAN = {
  title: "",
  objective: "",
  description: "",
  deadline: "",
  status: "planned",
};

const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "ongoing";
  if (status === "cancelled") return "draft";
  return "upcoming";
}

function toFormDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

export default function Strategic() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get("/strategic-plans");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PLAN);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || "",
      objective: row.objective || "",
      description: row.description || "",
      deadline: toFormDate(row.deadline),
      status: row.status || "planned",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required.");
    if (!form.objective.trim()) return toast.error("Objective is required.");
    if (!form.deadline) return toast.error("Deadline is required.");

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/strategic-plans/${editing._id}`, form);
        toast.success("Strategic plan updated");
      } else {
        await api.post("/strategic-plans", form);
        toast.success("Strategic plan created");
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (row, status) => {
    try {
      await api.patch(`/strategic-plans/${row._id}/status`, { status });
      toast.success("Status updated");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/strategic-plans/${confirmDelete._id}`);
      toast.success("Strategic plan deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div>
          <div className="font-medium text-brand-text">{r.title}</div>
          <div className="text-xs text-brand-muted">{r.objective}</div>
        </div>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (r) => (
        <span className="text-brand-muted">
          {r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusBadge variant={statusVariant(r.status)}>
            {r.status.replace("_", " ")}
          </StatusBadge>
          <select
            value={r.status}
            onChange={(e) => changeStatus(r, e.target.value)}
            className="text-xs border border-brand-border rounded-md px-1.5 py-1 bg-white"
            aria-label="Change status"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => (
        <RowActions
          onEdit={() => openEdit(r)}
          onDelete={() => setConfirmDelete(r)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Strategic Plans"
        subtitle="Define and follow the association's strategic objectives."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search strategic plans..."
        searchFn={(r, q) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.objective || "").toLowerCase().includes(q)
        }
        emptyMessage="No strategic plans yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit strategic plan" : "New strategic plan"}
        subtitle={editing ? editing.title : "Create a new strategic plan"}
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
              form="strategic-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="strategic-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Digital Transformation"
            />
          </Field>

          <Field label="Objective" required>
            <TextInput
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="Improve digital management"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline" required>
              <DateInput
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete strategic plan?"
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