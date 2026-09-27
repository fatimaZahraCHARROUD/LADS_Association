import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Mail, MapPin, ImagePlus, X } from "lucide-react";
import { api, API_BASE } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";

const FULL_PHOTO = (p) =>
  p && !p.startsWith("http") ? `${API_BASE}${p}` : p || "";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  genre: "Male",
  birthday: "",
  ville: "",
  niveau_etude: "",
  specialite_etude: "",
  situation: "Active",
  departement: "",
  cotisation_payee: false,
  status: "active",
};

export default function AdminMembers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ nom: "", ville: "", status: "", departement: "" });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const data = await api.get(`/members/search${suffix}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setFormOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      fullName: r.fullName || "",
      email: r.email || "",
      password: "",
      phone: r.phone || "",
      genre: r.genre || "Male",
      birthday: r.birthday || "",
      ville: r.ville || "",
      niveau_etude: r.niveau_etude || "",
      specialite_etude: r.specialite_etude || "",
      situation: r.situation || "Active",
      departement: r.departement?.[0] || "",
      cotisation_payee: !!r.cotisation_payee,
      status: r.status || "active",
    });
    setFile(null);
    setFormOpen(true);
  };

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `${API_BASE}/members/${editing._id}`
        : `${API_BASE}/members`;
      const method = editing ? "PATCH" : "POST";

      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        genre: form.genre,
        birthday: form.birthday,
        ville: form.ville,
        niveau_etude: form.niveau_etude,
        specialite_etude: form.specialite_etude,
        situation: form.situation,
        cotisation_payee: form.cotisation_payee,
        status: form.status,
      };
      if (form.departement) payload.departement = [form.departement];
      if (form.password) payload.password = form.password;

      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") fd.append(k, v);
      });
      if (file) fd.append("profileImage", file);

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
      }

      toast.success(editing ? "Member updated" : "Member added");
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
      await api.delete(`/members/${confirmDelete._id}`);
      toast.success("Member deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const villes = useMemo(
    () => [...new Set(rows.map((r) => r.ville).filter(Boolean))],
    [rows]
  );
  const departements = useMemo(
    () => [...new Set(rows.flatMap((r) => r.departement || []))].filter(Boolean),
    [rows]
  );

  const columns = [
    {
      key: "photo",
      header: "Photo",
      render: (r) => (
        <img
          src={FULL_PHOTO(r.profileImage)}
          alt={r.fullName}
          className="w-10 h-10 rounded-full object-cover bg-gray-100"
        />
      ),
    },
    {
      key: "fullName",
      header: "Name",
      render: (r) => (
        <div>
          <div className="font-medium text-brand-text">{r.fullName}</div>
          <div className="text-xs text-brand-muted">{r.membershipNumber || "—"}</div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <Mail size={13} />
          {r.email}
        </span>
      ),
    },
    {
      key: "ville",
      header: "City",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <MapPin size={13} />
          {r.ville || "—"}
        </span>
      ),
    },
    {
      key: "departement",
      header: "Dept",
      render: (r) => (r.departement?.[0] || "—"),
    },
    {
      key: "situation",
      header: "Poste",
      render: (r) => (r.situation || "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            r.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-brand-muted"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              r.status === "active" ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {r.status}
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

  const fieldClass =
    "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/30";

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Manage all LADS association members."
        onAdd={openAdd}
        addLabel="Add Member"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={filters.nom}
          onChange={(e) => setFilters((f) => ({ ...f, nom: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by name..."
          className={fieldClass + " md:max-w-xs"}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className={fieldClass + " md:max-w-[130px]"}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filters.ville}
          onChange={(e) => setFilters((f) => ({ ...f, ville: e.target.value }))}
          className={fieldClass + " md:max-w-[160px]"}
        >
          <option value="">All cities</option>
          {villes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          value={filters.departement}
          onChange={(e) => setFilters((f) => ({ ...f, departement: e.target.value }))}
          className={fieldClass + " md:max-w-[170px]"}
        >
          <option value="">All depts</option>
          {departements.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors"
        >
          Apply filters
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchFn={(r, q) =>
          (r.fullName || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.membershipNumber || "").toLowerCase().includes(q) ||
          (r.ville || "").toLowerCase().includes(q)
        }
        emptyMessage="No members found."
      />

      <Drawer
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? "Edit Member" : "Add Member"}
        subtitle={editing ? editing.fullName : "Create a new association member"}
        width="max-w-2xl"
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
              type="button"
              onClick={submit}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update" : "Add"}
            </button>
          </div>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={file ? URL.createObjectURL(file) : FULL_PHOTO(editing?.profileImage)}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover bg-gray-100 border border-brand-border"
            />
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-brand-primary bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
              <ImagePlus size={16} />
              {file ? file.name : "Choose photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-brand-muted hover:text-brand-danger"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Full name *</label>
              <input required value={form.fullName} onChange={set("fullName")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Email *</label>
              <input required type="email" value={form.email} onChange={set("email")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">
                {editing ? "New password (optional)" : "Password *"}
              </label>
              <input
                type="password"
                required={!editing}
                value={form.password}
                onChange={set("password")}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Phone</label>
              <input value={form.phone} onChange={set("phone")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Genre</label>
              <select value={form.genre} onChange={set("genre")} className={fieldClass}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Birthday</label>
              <input type="date" value={form.birthday} onChange={set("birthday")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">City</label>
              <input value={form.ville} onChange={set("ville")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Department</label>
              <input value={form.departement} onChange={set("departement")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Niveau d'étude</label>
              <input value={form.niveau_etude} onChange={set("niveau_etude")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Spécialité</label>
              <input value={form.specialite_etude} onChange={set("specialite_etude")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Poste (situation)</label>
              <input value={form.situation} onChange={set("situation")} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-text mb-1 block">Status</label>
              <select value={form.status} onChange={set("status")} className={fieldClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={form.cotisation_payee}
              onChange={set("cotisation_payee")}
              className="w-4 h-4 accent-brand-primary"
            />
            Cotisation payée
          </label>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete member?"
        message={
          confirmDelete
            ? `The member ${confirmDelete.fullName} will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}