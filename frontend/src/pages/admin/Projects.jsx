import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import RowActions from "../../components/admin/RowActions";
import ImageUrlInput from "../../components/admin/ImageUrlInput";
import {
  Field,
  TextInput,
  NumberInput,
  DateInput,
  UrlInput,
  Select,
  Toggle,
} from "../../components/admin/FormField";

const EMPTY_PROJECT = {
  title: "",
  description: "",
  img: "",
  departmentId: "",
  managerIds: [],
  memberIds: [],
  startDate: "",
  endDate: "",
  status: "planned",
  progress: 0,
  driveUrl: "",
  isPublished: false,
};

const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
];

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "ongoing";
  if (status === "on_hold") return "draft";
  return "upcoming";
}

function toFormDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

const idOf = (x) => (x && typeof x === "object" ? x._id : x);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");
const names = (list) =>
  (list || []).map((u) => u.fullName).filter(Boolean).join(", ") || "—";
const isHttpUrl = (u) => /^https?:\/\//i.test(u || "");

function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-brand-primary" style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs text-brand-muted w-9 text-right">{v}%</span>
    </div>
  );
}

function PeoplePicker({ users, value, onChange }) {
  const [q, setQ] = useState("");
  const shown = users.filter((u) =>
    (u.fullName || "").toLowerCase().includes(q.trim().toLowerCase())
  );
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="border border-brand-border rounded-lg bg-white">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search..."
        className="w-full px-3 py-2 text-sm border-b border-brand-border rounded-t-lg focus:outline-none"
      />
      <div className="max-h-40 overflow-y-auto p-2 space-y-1">
        {shown.length === 0 && (
          <p className="text-xs text-brand-muted px-1 py-2">No users found.</p>
        )}
        {shown.map((u) => (
          <label
            key={u._id}
            className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(u._id)}
              onChange={() => toggle(u._id)}
            />
            <span className="text-brand-text">{u.fullName}</span>
            <span className="text-xs text-brand-muted">{u.email}</span>
          </label>
        ))}
      </div>
      <div className="px-3 py-1.5 text-xs text-brand-muted border-t border-brand-border">
        {value.length} selected
      </div>
    </div>
  );
}

export default function Projects() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [quick, setQuick] = useState({ status: "planned", progress: 0 });
  const [quickSaving, setQuickSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await api.get("/projects");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
    Promise.all([api.get("/members"), api.get("/departments")])
      .then(([m, d]) => {
        setUsers(Array.isArray(m) ? m : []);
        setDepartments(Array.isArray(d) ? d : []);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PROJECT);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || "",
      description: row.description || "",
      img: row.img || "",
      departmentId: idOf(row.departmentId) || "",
      managerIds: (row.managerIds || []).map(idOf),
      memberIds: (row.memberIds || []).map(idOf),
      startDate: toFormDate(row.startDate),
      endDate: toFormDate(row.endDate),
      status: row.status || "planned",
      progress: row.progress ?? 0,
      driveUrl: row.driveUrl || "",
      isPublished: !!row.isPublished,
    });
    setDetail(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const openDetail = (row) => {
    setDetail(row);
    setQuick({ status: row.status || "planned", progress: row.progress ?? 0 });
  };

  const submit = async (e) => {
    e.preventDefault();
    const progress = Number(form.progress);
    if (!form.title.trim()) return toast.error("Title is required.");
    if (!form.startDate || !form.endDate)
      return toast.error("Start and end dates are required.");
    if (form.endDate < form.startDate)
      return toast.error("End date must be after start date.");
    if (!Number.isFinite(progress) || progress < 0 || progress > 100)
      return toast.error("Progress must be between 0 and 100.");

    const payload = {
      ...form,
      progress,
      departmentId: form.departmentId || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/projects/${editing._id}`, payload);
        toast.success("Project updated");
      } else {
        await api.post("/projects", payload);
        toast.success("Project created");
      }
      setDrawerOpen(false);
      await loadProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveQuick = async () => {
    const progress = Number(quick.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100)
      return toast.error("Progress must be between 0 and 100.");

    setQuickSaving(true);
    try {
      const updated = await api.patch(`/projects/${detail._id}/status`, {
        status: quick.status,
        progress,
      });
      toast.success("Status and progress updated");
      setDetail((prev) => ({
        ...prev,
        status: updated.status,
        progress: updated.progress,
      }));
      await loadProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQuickSaving(false);
    }
  };

  const togglePublish = async (row) => {
    try {
      await api.patch(`/projects/${row._id}/publish`, {});
      toast.success(row.isPublished ? "Moved to draft" : "Published");
      setDetail((prev) =>
        prev && prev._id === row._id
          ? { ...prev, isPublished: !row.isPublished }
          : prev
      );
      await loadProjects();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${confirmDelete._id}`);
      toast.success("Project deleted");
      setConfirmDelete(null);
      await loadProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Project",
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.img ? (
            <img
              src={r.img}
              alt=""
              className="w-9 h-9 rounded-md object-cover border border-brand-border"
            />
          ) : null}
          <div>
            <div className="font-medium text-brand-text">{r.title}</div>
            <div className="text-xs text-brand-muted">
              {r.departmentId?.name || "No department"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "managers",
      header: "Manager",
      render: (r) => <span className="text-brand-muted">{names(r.managerIds)}</span>,
    },
    {
      key: "members",
      header: "Members",
      render: (r) => (
        <span className="text-brand-muted">{(r.memberIds || []).length}</span>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (r) => (
        <span className="text-brand-muted whitespace-nowrap">
          {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={statusVariant(r.status)}>
          {(r.status || "").replace("_", " ")}
        </StatusBadge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (r) => <ProgressBar value={r.progress} />,
    },
    {
      key: "isPublished",
      header: "Visibility",
      render: (r) => (
        <StatusBadge variant={r.isPublished ? "published" : "draft"}>
          {r.isPublished ? "Published" : "Draft"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => (
        <RowActions
          onView={() => openDetail(r)}
          isPublished={r.isPublished}
          onTogglePublish={() => togglePublish(r)}
          onEdit={() => openEdit(r)}
          onDelete={() => setConfirmDelete(r)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Create projects, assign a manager and members, and follow their progress."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchFn={(r, q) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.departmentId?.name || "").toLowerCase().includes(q)
        }
        emptyMessage="No projects yet."
      />

      {/* ---------- Create / edit ---------- */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit project" : "New project"}
        subtitle={editing ? editing.title : "Create a new project"}
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
              form="project-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="project-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Riwak"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </Field>

          <Field label="Department">
            <Select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Manager(s)">
            <PeoplePicker
              users={users}
              value={form.managerIds}
              onChange={(managerIds) => setForm({ ...form, managerIds })}
            />
          </Field>

          <Field label="Members">
            <PeoplePicker
              users={users}
              value={form.memberIds}
              onChange={(memberIds) => setForm({ ...form, memberIds })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" required>
              <DateInput
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End date" required>
              <DateInput
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Progress (%)">
              <NumberInput
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Google Drive resources link">
            <UrlInput
              value={form.driveUrl}
              onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
          </Field>

          <ImageUrlInput
            label="Project image (URL, optional)"
            value={form.img}
            onChange={(img) => setForm({ ...form, img })}
          />

          <Field>
            <Toggle
              checked={form.isPublished}
              onChange={(v) => setForm({ ...form, isPublished: v })}
              label="Published on the public website"
            />
          </Field>
        </form>
      </Drawer>

      {/* ---------- Details + quick status/progress update ---------- */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title || "Project"}
        subtitle={detail?.departmentId?.name || "No department"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => openEdit(detail)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover"
            >
              Edit project
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-5 text-sm">
            {detail.img && (
              <img
                src={detail.img}
                alt=""
                className="w-full max-h-48 object-cover rounded-lg border border-brand-border"
              />
            )}
            <p className="text-brand-text whitespace-pre-line">
              {detail.description || "No description."}
            </p>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-brand-muted">Manager(s)</dt>
                <dd className="text-brand-text">{names(detail.managerIds)}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-muted">Dates</dt>
                <dd className="text-brand-text">
                  {fmtDate(detail.startDate)} → {fmtDate(detail.endDate)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-brand-muted">
                  Members ({(detail.memberIds || []).length})
                </dt>
                <dd className="text-brand-text">{names(detail.memberIds)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-brand-muted">Google Drive resources</dt>
                <dd>
                  {isHttpUrl(detail.driveUrl) ? (
                    <a
                      href={detail.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-primary underline break-all"
                    >
                      {detail.driveUrl}
                    </a>
                  ) : (
                    <span className="text-brand-muted">No link yet.</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border border-brand-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-text">Public website</span>
                <StatusBadge variant={detail.isPublished ? "published" : "draft"}>
                  {detail.isPublished ? "Published" : "Draft"}
                </StatusBadge>
              </div>
              <p className="text-xs text-brand-muted">
                {detail.isPublished
                  ? "This project is visible on the public Projects page."
                  : "This project is hidden from the public website."}
              </p>
              <button
                type="button"
                onClick={() => togglePublish(detail)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50"
              >
                {detail.isPublished ? "Move to draft" : "Publish"}
              </button>
            </div>

            <div className="rounded-lg border border-brand-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-text">Status & progress</span>
                <StatusBadge variant={statusVariant(detail.status)}>
                  {(detail.status || "").replace("_", " ")}
                </StatusBadge>
              </div>
              <ProgressBar value={detail.progress} />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={quick.status}
                  onChange={(e) => setQuick({ ...quick, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
                <NumberInput
                  min={0}
                  max={100}
                  value={quick.progress}
                  onChange={(e) => setQuick({ ...quick, progress: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={saveQuick}
                disabled={quickSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
              >
                {quickSaving ? "Saving..." : "Update status & progress"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete project?"
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
