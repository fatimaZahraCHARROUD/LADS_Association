import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { EMPTY_ML, ml, mlDisplay, hasAnyMl } from "../../utils/i18n";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import MultilingualInput from "../../components/admin/MultilingualInput";

const EMPTY_INFO = {
  title: { ...EMPTY_ML },
  content: { ...EMPTY_ML },
};

export default function AdminInfo() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_INFO);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get("/lads-info");
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
    setForm(EMPTY_INFO);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: ml(row.title),
      content: ml(row.content),
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { if (!saving) setDrawerOpen(false); };

  const submit = async (e) => {
    e.preventDefault();
    if (!hasAnyMl(form.title)) {
      toast.error("Title is required in at least one language.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/lads-info/${editing._id}`, form);
        toast.success("Info updated");
      } else {
        await api.post("/lads-info", form);
        toast.success("Info created");
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
      await api.delete(`/lads-info/${confirmDelete._id}`);
      toast.success("Info deleted");
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
        <div className="font-medium text-brand-text">{mlDisplay(r.title)}</div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (r) => (
        <span className="text-brand-muted">
          {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
        </span>
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
        title="LADS Info"
        subtitle="Organization information pages (about, mission, etc.)."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search info pages..."
        searchFn={(r, q) => mlDisplay(r.title).toLowerCase().includes(q)}
        emptyMessage="No info pages yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit info" : "New info page"}
        subtitle={editing ? mlDisplay(editing.title) : "Create an info page"}
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
              form="info-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="info-form" onSubmit={submit} className="space-y-5">
          <MultilingualInput
            label="Title"
            required
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />

          <MultilingualInput
            as="textarea"
            rows={10}
            label="Content"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
          />
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete info page?"
        message={
          confirmDelete
            ? `"${mlDisplay(confirmDelete.title)}" will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}
