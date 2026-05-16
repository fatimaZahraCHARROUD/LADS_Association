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
import ImageUrlInput from "../../components/admin/ImageUrlInput";
import { Field, TextInput, Toggle } from "../../components/admin/FormField";

const EMPTY_NEWS = {
  title: { ...EMPTY_ML },
  content: { ...EMPTY_ML },
  thumbnail: "",
  coverImagePublicId: "",
  tagsInput: "",
  isPublished: false,
};

export default function AdminNews() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_NEWS);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
const [imageFile, setImageFile] = useState(null);

  const load = async () => {
    try {
      const data = await api.get("/news");
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
    setForm(EMPTY_NEWS);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: ml(row.title),
      content: ml(row.content),
      thumbnail: row.thumbnail || "",
      coverImagePublicId: row.coverImagePublicId || "",
      tagsInput: Array.isArray(row.tags) ? row.tags.join(", ") : "",
      isPublished: !!row.isPublished,
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
    let thumbnailUrl = form.thumbnail;
    let coverImagePublicId = form.coverImagePublicId;

    // ✅ upload image if selected
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);

      thumbnailUrl = uploaded.url;
   
         coverImagePublicId = uploaded.public_id;

    }

    const payload = {
      title: form.title,
      content: form.content,
      thumbnail: thumbnailUrl,
      coverImagePublicId:coverImagePublicId,
      isPublished: form.isPublished,
      tags: form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (editing) {
      await api.patch(`/news/${editing._id}`, payload);
      toast.success("Article updated");
    } else {
      await api.post("/news", payload);
      toast.success("Article created");
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
      await api.patch(`/news/${row._id}/publish`, {});
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
      await api.delete(`/news/${confirmDelete._id}`);
      toast.success("Article deleted");
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
  key: "thumbnail",
  header: "",
  width: "64px",
  render: (r) =>
    r.thumbnail ? (
      <img
        src={r.thumbnail}
        alt={mlDisplay(r.title) || "news"}
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
      key: "tags",
      header: "Tags",
      render: (r) =>
        Array.isArray(r.tags) && r.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {r.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-xs bg-gray-100 text-brand-muted rounded"
              >
                {t}
              </span>
            ))}
            {r.tags.length > 3 && (
              <span className="text-xs text-brand-muted">+{r.tags.length - 3}</span>
            )}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "isPublished",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={r.isPublished ? "published" : "draft"}>
          {r.isPublished ? "Published" : "Draft"}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => (
        <span className="text-brand-muted">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
        </span>
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
        title="News"
        subtitle="Manage news articles."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search news..."
        searchFn={(r, q) =>
          mlDisplay(r.title).toLowerCase().includes(q) ||
          (r.tags || []).join(" ").toLowerCase().includes(q)
        }
        emptyMessage="No news articles yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit article" : "New article"}
        subtitle={editing ? mlDisplay(editing.title) : "Publish a news article"}
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
              form="news-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="news-form" onSubmit={submit} className="space-y-5">
          <MultilingualInput
            label="Title"
            required
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
          />

          <MultilingualInput
            as="textarea"
            rows={8}
            label="Content"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
          />

          <Field label="Thumbnail">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </Field>
         {(imageFile || form.thumbnail) && (
          <img
            src={
              imageFile
                ? URL.createObjectURL(imageFile)
                : form.thumbnail
            }
            alt="thumbnail preview"
            className="w-32 h-32 rounded-lg object-cover border mt-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

          <Field label="Tags" hint="Comma-separated. E.g. announcement, partnership">
            <TextInput
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              placeholder="announcement, partnership"
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
        title="Delete article?"
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
