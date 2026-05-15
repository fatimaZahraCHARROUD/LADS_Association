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
import ImageUrlListInput from "../../components/admin/ImageUrlListInput";
import {
  Field, TextInput, DateInput, Select, Toggle,
} from "../../components/admin/FormField";

const EMPTY_ACTIVITY = {
  title: { ...EMPTY_ML },
  description: { ...EMPTY_ML },
  activityDate: "",
  location: "",
  categorie: "",
  images: [],
  status: "upcoming",
  isPublished: false,
};

function toFormDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

export default function AdminActivities() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ACTIVITY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
const [imageFiles, setImageFiles] = useState([]);

  const load = async () => {
    try {
      const data = await api.get("/activities");
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
  setImageFiles([]);
  setForm(EMPTY_ACTIVITY);
  setDrawerOpen(true);
};

  const openEdit = (row) => {
  setImageFiles([]);

  setEditing(row);
  setForm({
    title: ml(row.title),
    description: ml(row.description),
    activityDate: toFormDate(row.activityDate),
    location: row.location || "",
    categorie: row.categorie || "",
    images: Array.isArray(row.images) ? [...row.images] : [],
    status: row.status || "upcoming",
    isPublished: !!row.isPublished,
  });

  setDrawerOpen(true);
};

const closeDrawer = () => {
  if (saving) return;

  setImageFiles([]);
  setForm(EMPTY_ACTIVITY);

  setDrawerOpen(false);
};
  const submit = async (e) => {
  e.preventDefault();

  if (!hasAnyMl(form.title)) {
    toast.error("Title is required in at least one language.");
    return;
  }

  if (!form.activityDate) {
    toast.error("Activity date is required.");
    return;
  }

  setSaving(true);

  try {
    let uploadedImages = [...form.images];

    // ✅ upload all selected images
    if (imageFiles.length > 0) {
      const uploaded = await Promise.all(
        imageFiles.map((file) => uploadImage(file))
      );

      uploadedImages = uploaded;
    }

    const payload = {
      ...form,
      images: uploadedImages.filter(Boolean),
    };

    if (editing) {
      await api.patch(`/activities/${editing._id}`, payload);
      toast.success("Activity updated");
    } else {
      await api.post("/activities", payload);
      toast.success("Activity created");
    }

    setDrawerOpen(false);
    setImageFiles([]);
    await load();
  } catch (err) {
    toast.error(err.message);
  } finally {
    setSaving(false);
  }
};


  const togglePublish = async (row) => {
    try {
      await api.patch(`/activities/${row._id}/publish`, {});
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
      await api.delete(`/activities/${confirmDelete._id}`);
      toast.success("Activity deleted");
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
  key: "thumb",
  header: "",
  width: "64px",
  render: (r) => {
    const first = Array.isArray(r.images) ? r.images[0] : null;

    return first ? (
      <img
        src={first}
        alt={mlDisplay(r.title) || "activity"}
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
    );
  },
},
    {
      key: "title",
      header: "Title",
      render: (r) => (
        <div className="font-medium text-brand-text">{mlDisplay(r.title)}</div>
      ),
    },
    {
      key: "activityDate",
      header: "Date",
      render: (r) => (
        <span className="text-brand-muted">
          {r.activityDate ? new Date(r.activityDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "categorie",
      header: "Category",
      render: (r) => r.categorie || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={r.status === "completed" ? "completed" : "upcoming"}>
          {r.status}
        </StatusBadge>
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
        title="Activities"
        subtitle="Manage program activities."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search activities..."
        searchFn={(r, q) =>
          mlDisplay(r.title).toLowerCase().includes(q) ||
          (r.location || "").toLowerCase().includes(q) ||
          (r.categorie || "").toLowerCase().includes(q)
        }
        emptyMessage="No activities yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit activity" : "New activity"}
        subtitle={editing ? mlDisplay(editing.title) : "Create a new activity"}
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
              form="activity-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="activity-form" onSubmit={submit} className="space-y-5">
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
            <Field label="Activity date" required>
              <DateInput
                value={form.activityDate}
                onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <TextInput
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Location">
            <TextInput
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>

          <Field label="Activity images">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
            />
          </Field>
          {/* Preview selected images OR existing images */}
<div className="flex flex-wrap gap-3 mt-2">
  {imageFiles.length > 0
    ? imageFiles.map((file, index) => (
        <img
          key={index}
          src={URL.createObjectURL(file)}
          alt={`preview-${index}`}
          className="w-24 h-24 rounded-lg object-cover border"
        />
      ))
    : form.images?.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`activity-${index}`}
          className="w-24 h-24 rounded-lg object-cover border"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
</div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
            <Field>
              <Toggle
                checked={form.isPublished}
                onChange={(v) => setForm({ ...form, isPublished: v })}
                label="Published"
              />
            </Field>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete activity?"
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
