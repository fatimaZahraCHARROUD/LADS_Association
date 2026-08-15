import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getCurrentUserId } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import { Field, UrlInput, Select } from "../../components/admin/FormField";

const EMPTY_DOCUMENT = {
  title: "",
  category: "",
  department: "",
  driveUrl: "",
  description: "",
  visibility: "department",
};

export default function AdminDocuments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DOCUMENT);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get("/documents");
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
    setForm(EMPTY_DOCUMENT);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || "",
      category: row.category || "",
      department: row.department?._id || row.department || "",
      driveUrl: row.driveUrl || "",
      description: row.description || "",
      visibility: row.visibility || "department",
    });
    setDrawerOpen(true);
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
    if (!form.driveUrl.trim()) {
      toast.error("Drive link is required.");
      return;
    }
    if (!form.department.trim()) {
      toast.error("Department ID is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, uploadedBy: getCurrentUserId() };
      if (editing) {
        await api.patch(`/documents/${editing._id}`, payload);
        toast.success("Document updated");
      } else {
        await api.post("/documents", payload);
        toast.success("Document created");
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
      await api.delete(`/documents/${confirmDelete._id}`);
      toast.success("Document deleted");
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
      render: (r) => <div className="font-medium text-brand-text">{r.title}</div>,
    },
    {
      key: "category",
      header: "Category",
      render: (r) => r.category || "—",
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (r) => (
        <StatusBadge variant={r.visibility === "public" ? "published" : "draft"}>
          {r.visibility}
        </StatusBadge>
      ),
    },
    {
      key: "driveUrl",
      header: "Drive link",
      render: (r) => (
        <a
          href={r.driveUrl}
          target="_blank"
          rel="noreferrer"
          className="text-brand-primary underline"
        >
          Open
        </a>
      ),
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(r)}
            className="px-3 py-1.5 text-sm rounded-lg border border-brand-border hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(r)}
            className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Manage shared association documents."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search documents..."
        searchFn={(r, q) =>
          r.title.toLowerCase().includes(q) ||
          (r.category || "").toLowerCase().includes(q)
        }
        emptyMessage="No documents yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit document" : "New document"}
        subtitle={editing ? editing.title : "Add a new document"}
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
              form="document-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="document-form" onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <input
              type="text"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>

          <Field label="Category">
            <input
              type="text"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
          <Field label="Drive link" required>
            <UrlInput
              value={form.driveUrl}
              onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
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

          <Field label="Visibility">
            <Select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <option value="public">Public</option>
              <option value="department">Department</option>
              <option value="private">Private</option>
            </Select>
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete document?"
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
