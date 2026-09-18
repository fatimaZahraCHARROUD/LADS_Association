 import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HoverImagePreview from "../../components/admin/HoverImagePreview";
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
  Field, TextInput, NumberInput, DateInput, TimeInput, UrlInput, Select, Toggle,
} from "../../components/admin/FormField";

const EMPTY_EVENT = {
  title: { ...EMPTY_ML },
  description: { ...EMPTY_ML },
  category: { ...EMPTY_ML },
  date: "",
  time: "",
  location: "",
  maxParticipants: 0,
  coverImage: "",
  coverImagePublicId: "",
  registerLink: "",
  status: "upcoming",
  isPublished: false,
};

function toFormDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

export default function AdminEvents() {
   const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
const [imageFile, setImageFile] = useState(null);
const [rows,setRows]=useState([]);

  const load = async () => {
    try {
      const data = await api.get("/events");
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

  setImageFile(null);

  setForm({
    ...EMPTY_EVENT,
    coverImage: "",
    coverImagePublicId: "",

  });

  setDrawerOpen(true);
};

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: ml(row.title),
      description: ml(row.description),
      category: ml(row.category),
      date: toFormDate(row.date),
      time: row.time || "",
      location: row.location || "",
      maxParticipants: row.maxParticipants ?? 0,
      coverImage: row.coverImage || "",
      coverImagePublicId: row.coverImagePublicId || "",
      registerLink: row.registerLink || "",
      status: row.status || "upcoming",
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
    let imageUrl = form.coverImage;
    let imagePublicId = form.coverImagePublicId;

    // ✅ upload file if selected
    if (imageFile) {
         const uploaded = await uploadImage(imageFile);

        imageUrl = uploaded.url;
        imagePublicId = uploaded.public_id;      
    }

    const payload = {
      ...form,
      coverImage: imageUrl,
      coverImagePublicId: imagePublicId,
      maxParticipants: Number(form.maxParticipants) || 0,
    };

    if (editing) {
      await api.patch(`/events/${editing._id}`, payload);
      toast.success("Event updated");
    } else {
      await api.post("/events", payload);
      toast.success("Event created");
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

    const groupedEvents = Object.values(
  rows
    .sort(
      (a,b)=>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .reduce((groups,event)=>{

      const category =
        mlDisplay(
          event.category,
          "en"
        ) || "No category";


      if(!groups[category]){
        groups[category]={
          category,
          latest:new Date(event.createdAt),
          events:[]
        };
      }


      groups[category].events.push(event);


      return groups;

    },{})
)
.sort(
(a,b)=>b.latest-a.latest
);

const existingCategories = Object.values(
  rows.reduce((acc, event) => {

    const key = JSON.stringify(event.category);

    if (!acc[key]) {
      acc[key] = event.category;
    }

    return acc;

  }, {})
);

  const togglePublish = async (row) => {
    try {
      await api.patch(`/events/${row._id}/publish`, {});
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
      await api.delete(`/events/${confirmDelete._id}`);
      toast.success("Event deleted");
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
  key: "coverImage",
  header: "",
  width: "112px",
  render: (r) => (
    <HoverImagePreview src={r.coverImage} alt={mlDisplay(r.title) || "event"} />
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
      key: "location",
      header: "Location",
      render: (r) => r.location || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge variant={r.status === "past" ? "past" : "upcoming"}>
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
        title="Events"
        subtitle="Manage upcoming and past events."
        onAdd={openCreate}
      />

     {
groupedEvents.map(group=>(
<div 
 key={group.category}
 className="mb-8"
>


<h2 className="text-lg font-bold mb-3">
 {group.category}
</h2>


<DataTable
 columns={columns}
 rows={group.events}
 loading={loading}
 searchPlaceholder="Search events..."
 emptyMessage="No events"
/>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit event" : "New event"}
        subtitle={editing ? mlDisplay(editing.title) : "Create a new event"}
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
              form="event-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="event-form" onSubmit={submit} className="space-y-5">
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
            <Field label="Time">
              <TimeInput
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Location">
            <TextInput
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Casablanca"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
           <MultilingualInput
            as="textarea" rows={1}
            label="Category"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
          />
            <Field label="Max participants">
              <NumberInput
                min={0}
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              />
            </Field>
          </div>

        <Field label="Cover image">
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
  />
</Field>

{(imageFile || form.coverImage) && (
  <img
    src={
      imageFile
        ? URL.createObjectURL(imageFile)
        : form.coverImage
    }
    alt="cover preview"
    className="w-32 h-32 rounded-lg object-cover border mt-2"
    onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
  />
)}

          <Field label="Registration link">
            <UrlInput
              value={form.registerLink}
              onChange={(e) => setForm({ ...form, registerLink: e.target.value })}
              placeholder="https://..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
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
</div>
))
}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete event?"
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
