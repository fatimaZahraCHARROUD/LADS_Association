import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BriefcaseBusiness, Users, UserCog, UserCheck } from "lucide-react";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import { Field, TextInput, Select } from "../../components/admin/FormField";

const EMPTY_FORM = {
  name: "",
  description: "",
  manager: "",
  viceManager: "",
  teamManagers: [],
  members: [],
};

export default function AdminDepartments() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    try {
      const [departments, members] = await Promise.all([
        api.get("/departments"),
        api.get("/users"),
      ]);
      setRows(Array.isArray(departments) ? departments : []);
      setUsers(Array.isArray(members) ? members : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userOptions = useMemo(
    () => users.filter((user) => user && user._id && user.fullName),
    [users]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      description: row.description || "",
      manager: row.manager?._id || row.manager || "",
      viceManager: row.viceManager?._id || row.viceManager || "",
      teamManagers: Array.isArray(row.teamManagers)
        ? row.teamManagers.map((u) => u?._id || u)
        : [],
      members: Array.isArray(row.members)
        ? row.members.map((u) => u?._id || u)
        : [],
    });
    setDrawerOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description || "",
        manager: form.manager || null,
        viceManager: form.viceManager || null,
        teamManagers: Array.from(new Set(form.teamManagers.filter(Boolean))),
        members: Array.from(new Set(form.members.filter(Boolean))),
      };

      if (editing) {
        await api.patch(`/departments/${editing._id}`, payload);
        toast.success("Department updated");
      } else {
        await api.post("/departments", payload);
        toast.success("Department created");
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
      await api.delete(`/departments/${confirmDelete._id}`);
      toast.success("Department deleted");
      setConfirmDelete(null);
      setViewing(null);
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
        <div>
          <div className="font-semibold text-brand-text">{r.name}</div>
          <div className="text-xs text-brand-muted mt-1">{r.description || "No description"}</div>
        </div>
      ),
    },
    {
      key: "manager",
      header: "Manager",
      render: (r) => <MemberValue value={r.manager} />, 
    },
    {
      key: "viceManager",
      header: "Vice Manager",
      render: (r) => <MemberValue value={r.viceManager} />,
    },
    {
      key: "teamManagers",
      header: "Team Managers",
      render: (r) => <CountValue value={r.teamManagers} />,
    },
    {
      key: "members",
      header: "Members",
      render: (r) => <CountValue value={r.members} />,
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => (
        <RowActions
          onView={() => setViewing(r)}
          onEdit={() => openEdit(r)}
          onDelete={() => setConfirmDelete(r)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Department CRUD, manager assignment, and member overview."
        onAdd={openCreate}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search departments..."
        searchFn={(r, q) =>
          (r.name || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
        }
        emptyMessage="No departments yet."
      />

      <Drawer
        open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        title={editing ? "Edit department" : "New department"}
        subtitle={editing ? editing.name : "Create a department"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="department-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <form id="department-form" onSubmit={submit} className="space-y-5">
          <Field label="Department name" required>
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Education"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              placeholder="Short description"
            />
          </Field>

          <Field label="Manager">
            <Select
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
            >
              <option value="">No manager</option>
              {userOptions.map((user) => (
                <option key={user._id} value={user._id}>{user.fullName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Vice Manager">
            <Select
              value={form.viceManager}
              onChange={(e) => setForm({ ...form, viceManager: e.target.value })}
            >
              <option value="">No vice manager</option>
              {userOptions.map((user) => (
                <option key={user._id} value={user._id}>{user.fullName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Team Managers">
            <SelectMultiple
              value={form.teamManagers}
              onChange={(value) => setForm({ ...form, teamManagers: value })}
              options={userOptions}
            />
          </Field>

          <Field label="Members">
            <SelectMultiple
              value={form.members}
              onChange={(value) => setForm({ ...form, members: value })}
              options={userOptions}
            />
          </Field>
        </form>
      </Drawer>

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name || "Department"}
        subtitle="Department members and leadership"
        footer={
          viewing && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text bg-white border border-brand-border hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { setViewing(null); openEdit(viewing); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover"
              >
                Edit
              </button>
            </div>
          )
        }
      >
        {viewing && (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm">
              <DetailRow icon={<UserCog size={14} />} label="Manager" value={<MemberValue value={viewing.manager} />} />
              <DetailRow icon={<UserCheck size={14} />} label="Vice Manager" value={<MemberValue value={viewing.viceManager} />} />
              <DetailRow icon={<BriefcaseBusiness size={14} />} label="Team Managers" value={<CountValue value={viewing.teamManagers} />} />
              <DetailRow icon={<Users size={14} />} label="Members" value={<CountValue value={viewing.members} />} />
            </div>

            {viewing.description && (
              <div>
                <h3 className="text-sm font-medium text-brand-text mb-2">Description</h3>
                <p className="whitespace-pre-wrap text-sm text-brand-text bg-white border border-brand-border rounded-lg p-3">
                  {viewing.description}
                </p>
              </div>
            )}

            <MemberList title="Team Managers" members={viewing.teamManagers} />
            <MemberList title="Members" members={viewing.members} />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete department?"
        message={
          confirmDelete ? `"${confirmDelete.name}" will be permanently removed.` : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}

function MemberValue({ value }) {
  if (!value) return <span className="text-brand-muted">—</span>;
  const fullName = typeof value === "string" ? value : value.fullName || value.email || "Unknown";
  return <span className="text-brand-text">{fullName}</span>;
}

function CountValue({ value }) {
  const count = Array.isArray(value) ? value.length : 0;
  return <span className="text-brand-text">{count}</span>;
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-brand-muted w-28 shrink-0 inline-flex items-center gap-1.5">{icon}{label}</span>
      <span className="text-brand-text break-all">{value}</span>
    </div>
  );
}

function SelectMultiple({ value = [], onChange, options = [] }) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div className="space-y-2 rounded-lg border border-brand-border p-2 bg-white">
      {options.length === 0 ? (
        <p className="text-xs text-brand-muted">No users available.</p>
      ) : (
        options.map((user) => (
          <label key={user._id} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(user._id)}
              onChange={() => toggle(user._id)}
              className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
            />
            <span>{user.fullName}</span>
          </label>
        ))
      )}
    </div>
  );
}

function MemberList({ title, members = [] }) {
  if (!Array.isArray(members) || members.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-brand-text mb-2">{title}</h3>
        <p className="text-sm text-brand-muted">No members assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-brand-text mb-2">{title}</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member?._id || member} className="flex items-center justify-between rounded-lg border border-brand-border p-2 text-sm">
            <span className="text-brand-text">{member?.fullName || member?.email || member || "Unknown"}</span>
            {member?.email && <span className="text-brand-muted">{member.email}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
