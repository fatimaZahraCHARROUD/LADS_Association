import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Users, Building2 } from "lucide-react";
import { api, getCurrentUserId } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import { Field, Select, TextInput } from "../../components/admin/FormField";

const EMPTY_FORM = {
  name: "",
  description: "",
  departmentId: "",
  managerId: "",
  members: [],
  status: "active",
};

// Page "Cellules" du Responsable :
// il peut créer / modifier / supprimer les cellules (les siennes sont celles
// où il est le manager). Les membres sont choisis parmi ceux qu'il voit.
export default function RespCellules() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [myMembers, setMyMembers] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const myId = getCurrentUserId();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/cellules");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [deps, members] = await Promise.all([
        api.get("/departments"),
        api.get("/members/search"),
      ]);
      setDepartments(Array.isArray(deps) ? deps : []);
      setMyMembers(Array.isArray(members) ? members : []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOptions(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      managerId: myId || "",
      departmentId: departments[0]?._id || "",
    });
    setFormOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name || "",
      description: r.description || "",
      departmentId: r.departmentId?._id || r.departmentId || "",
      managerId: r.managerId?._id || r.managerId || "",
      members: (r.members || []).map((m) => m._id || m),
      status: r.status || "active",
    });
    setFormOpen(true);
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(id)
        ? f.members.filter((x) => x !== id)
        : [...f.members, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Cellule name is required.");
      return;
    }
    if (!form.departmentId) {
      toast.error("Please choose a department.");
      return;
    }
    if (!form.managerId) {
      toast.error("Please choose the responsable.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        departmentId: form.departmentId,
        managerId: form.managerId,
        members: form.members,
        status: form.status,
      };
      if (editing) {
        await api.patch(`/cellules/${editing._id}`, payload);
        toast.success("Cellule updated");
      } else {
        await api.post("/cellules", payload);
        toast.success("Cellule created");
      }
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
      await api.delete(`/cellules/${confirmDelete._id}`);
      toast.success("Cellule deleted");
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
      key: "name",
      header: "Name",
      render: (r) => (
        <div className="font-medium text-brand-text">{r.name}</div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <Building2 size={13} />
          {r.departmentId?.name || "—"}
        </span>
      ),
    },
    {
      key: "manager",
      header: "Responsable",
      render: (r) => r.managerId?.fullName || "—",
    },
    {
      key: "members",
      header: "Members",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <Users size={13} />
          {Array.isArray(r.members) ? r.members.length : 0}
        </span>
      ),
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

  const managerOptions = useMemo(() => {
    const map = new Map();
    if (myId) {
      map.set(myId, {
        id: myId,
        label: "Me (responsable)",
      });
    }
    myMembers.forEach((m) => {
      map.set(m._id, { id: m._id, label: m.fullName });
    });
    return [...map.values()];
  }, [myId, myMembers]);

  return (
    <>
      <PageHeader
        title="Cellules"
        subtitle="Manage the cellules you are responsible for."
        onAdd={openAdd}
        addLabel="New Cellule"
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchFn={(r, q) =>
          (r.name || "").toLowerCase().includes(q) ||
          (r.departmentId?.name || "").toLowerCase().includes(q) ||
          (r.managerId?.fullName || "").toLowerCase().includes(q)
        }
        emptyMessage="No cellules yet."
      />

      <Drawer
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? "Edit Cellule" : "New Cellule"}
        subtitle={editing ? editing.name : "Create a new cellule"}
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
              type="submit"
              form="cellule-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="cellule-form" onSubmit={submit} className="space-y-5">
          <Field label="Name" required>
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. IT Web, IT Mobile..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department" required>
              <Select
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
              >
                <option value="">Choose a department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Responsable (manager)" required>
              <Select
                value={form.managerId}
                onChange={(e) =>
                  setForm({ ...form, managerId: e.target.value })
                }
              >
                {managerOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>

          <Field
            label="Members (only the members you can see)"
            hint="Select the members that belong to this cellule."
          >
            <div className="max-h-52 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border">
              {myMembers.length === 0 && (
                <div className="px-4 py-3 text-sm text-brand-muted">
                  No members available in your cellules.
                </div>
              )}
              {myMembers.map((m) => (
                <label
                  key={m._id}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-brand-bg/60"
                >
                  <input
                    type="checkbox"
                    checked={form.members.includes(m._id)}
                    onChange={() => toggleMember(m._id)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-sm text-brand-text">{m.fullName}</span>
                  <span className="ml-auto text-xs text-brand-muted">
                    {m.departement?.[0] || "—"}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete cellule?"
        message={
          confirmDelete
            ? `The cellule "${confirmDelete.name}" will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}