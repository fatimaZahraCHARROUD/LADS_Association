import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ImageOff } from "lucide-react";
import { api } from "../../services/api";
import { EMPTY_ML, ml, mlDisplay, hasAnyMl } from "../../utils/i18n";
import { uploadImage } from "../../services/upload";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import StatusBadge from "../../components/admin/StatusBadge";
import RowActions from "../../components/admin/RowActions";
import MultilingualInput from "../../components/admin/MultilingualInput";
import {
  Field, TextInput, DateInput, TimeInput, UrlInput, Select, Toggle,
} from "../../components/admin/FormField";

const EMPTY_FORMATION = {
  title: { ...EMPTY_ML },
  description: { ...EMPTY_ML },
  imgUrl: "",
  coverImagePublicId: "",
  date: "",
  heure: "",
  category: "",
  status: "upcoming",
  registrationLink: "",
  isPublished: false,
};

function toFormDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "ongoing") return "ongoing";
  return "upcoming";
}

export default function AdminFormations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORMATION);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
const [imageFile, setImageFile] = useState(null);

  const load = async () => {
    try {
      const data = await api.get("/formations");
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
  setForm(EMPTY_FORMATION);
  setImageFile(null);
  setDrawerOpen(true);
};

  const openEdit = (row) => {
  setEditing(row);

  setForm({
    title: ml(row.title),
    description: ml(row.description),
    imgUrl: row.imgUrl || "",
        coverImagePublicId: row.coverImagePublicId || "",
    date: toFormDate(row.date),
    heure: row.heure || "",
    category: row.category || "",
    status: row.status || "upcoming",
    registrationLink: row.registrationLink || "",
    isPublished: !!row.isPublished,
  });

  setImageFile(null);

  setDrawerOpen(true);
};

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

 const submit = async (e) => {
  e.preventDefault();

  if (!hasAnyMl(form.title)) {
    toast.error("Title is required in at least one language.");
    return;
  }

  if (!form.date) {
    toast.error("Date is required.");
    return;
  }

  setSaving(true);

  try {
    let imageUrl = form.imgUrl;
    let coverImagePublicId = form.coverImagePublicId;

    // upload new image if selected
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);

      imageUrl = uploaded.url;
      coverImagePublicId = uploaded.public_id;

    
    }

    const payload = {
      ...form,
      imgUrl: imageUrl,
      coverImagePublicId,

    };

    if (editing) {
      await api.patch(`/formations/${editing._id}`, payload);
      toast.success("Formation updated");
    } else {
      await api.post("/formations", payload);
      toast.success("Formation created");
    }

    setDrawerOpen(false);
    setImageFile(null);

    await load();
  } catch (err) {
    toast.error(err.message);
  } finally {
    setSaving(false);
  }
};

  const togglePublish = async (row) => {
    try {
      await api.patch(`/formations/${row._id}/publish`, {});
      toast.success(row.isPublished ? "Unpublished" : "Published");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/formations/${confirmDelete._id}`);
      toast.success("Formation deleted");
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
  key: "imgUrl",
  header: "",
  width: "64px",
  render: (r) =>
    r.imgUrl ? (
      <img
        src={r.imgUrl}
        alt={mlDisplay(r.title) || "formation"}
        className="w-12 h-12 rounded-md object-cover border border-brand-border bg-gray-100"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            "https://via.placeholder.com/150?text=No+Image";
        }}
      />
    ) : (
      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-300">
        <ImageOff size={16} />
      </div>
    ),
},
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div className="font-medium text-brand-text">{mlDisplay(r.title)}</div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-brand-muted">
          {r.date ? new Date(r.date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "heure",
      header: "Heure",
      render: (r) => r.heure || "—",
    },
    {
      key: "category",
      header: "Category",
      render: (r) => r.category || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
      ),
    },
    {
      key: "isPublished",
      header: "Published",
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
        title="Formations"
        subtitle="Manage trainings and courses."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search formations..."
        searchFn={(r, q) =>
          mlDisplay(r.title).toLowerCase().includes(q) ||
          (r.category || "").toLowerCase().includes(q) ||
          (r.heure || "").toLowerCase().includes(q)
        }
        emptyMessage="No formations yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit formation" : "New formation"}
        subtitle={editing ? mlDisplay(editing.title) : "Create a new formation"}
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
              form="formation-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="formation-form" onSubmit={submit} className="space-y-5">
          <MultilingualInput
            label="Title"
            required
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />

          <MultilingualInput
            as="textarea"
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <DateInput
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Heure">
              <TimeInput
                value={form.heure}
                onChange={(e) => setForm({ ...form, heure: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <TextInput
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
          </div>

         <Field label="Formation image">
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
  />
</Field>

{(imageFile || form.imgUrl) && (
  <img
    src={
      imageFile
        ? URL.createObjectURL(imageFile)
        : form.imgUrl
    }
    alt="formation preview"
    className="w-32 h-32 rounded-lg object-cover border mt-2"
    onError={(e) => {
      e.currentTarget.style.display = "none";
    }}
  />
)}

          <Field label="Registration link">
            <UrlInput
              value={form.registrationLink}
              onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
              placeholder="https://..."
            />
          </Field>

          <Field>
            <Toggle
              checked={form.isPublished}
              onChange={(v) => setForm({ ...form, isPublished: v })}
              label="Published"
            />
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete formation?"
        message={
          confirmDelete
            ? `"${mlDisplay(confirmDelete.title)}" will be permanently removed. This action cannot be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}
