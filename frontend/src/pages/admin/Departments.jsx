import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import { Field, Select, TextInput } from "../../components/admin/FormField";

const EMPTY_DEPARTMENT = {
  name: "",
  manager: "",
  viceManager: "",
  teamManagers: [],
  members: [],
};

function userId(user) {
  return typeof user === "string" ? user : user?._id || "";
}

function userName(user) {
  if (!user) return "—";
  if (typeof user === "string") return user || "—";
  return user?.fullName || user?.email || "Unknown user";
}

function peopleSummary(people = []) {
  return people.map(userName).join(", ") || "—";
}

function userOptionLabel(user) {
  const role = Array.isArray(user.role) ? user.role.join(", ") : "Member";
  return `${userName(user)} (${user.email}) · ${role}`;
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEPARTMENT);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [departmentData, userData] = await Promise.all([
        api.get("/departments"),
        api.get("/users"),
      ]);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      toast.error(error.message || "Could not load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_DEPARTMENT, teamManagers: [], members: [] });
    setDrawerOpen(true);
  };

  const openEdit = (department) => {
    setEditing(department);
    setForm({
      name: department.name || "",
      manager: userId(department.manager),
      viceManager: userId(department.viceManager),
      teamManagers: (department.teamManagers || []).map(userId).filter(Boolean),
      members: (department.members || []).map(userId).filter(Boolean),
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Department name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        manager: form.manager || null,
        viceManager: form.viceManager || null,
        teamManagers: form.teamManagers,
        members: form.members,
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
    } catch (error) {
      toast.error(error.message || "Could not save department");
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
      await load();
    } catch (error) {
      toast.error(error.message || "Could not delete department");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (department) => (
        <span className="font-medium text-brand-text">{department.name}</span>
      ),
    },
    { key: "manager", header: "Manager", render: (row) => userName(row.manager) || "—" },
    {
      key: "viceManager",
      header: "Vice Manager",
      render: (row) => userName(row.viceManager) || "—",
    },
    {
      key: "teamManagers",
      header: "Team Managers",
      render: (row) => (
        <span className="line-clamp-2" title={peopleSummary(row.teamManagers)}>
          {peopleSummary(row.teamManagers)}
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (row) => (
        <span className="line-clamp-2" title={peopleSummary(row.members)}>
          {peopleSummary(row.members)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      tdClassName: "text-right",
      render: (row) => (
        <RowActions
          onView={() => setViewing(row)}
          onEdit={() => openEdit(row)}
          onDelete={() => setConfirmDelete(row)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Manage departments, leadership, and members."
        onAdd={openCreate}
        addLabel="Add Department"
      />

      <DataTable
        columns={columns}
        rows={departments}
        loading={loading}
        emptyMessage="No departments yet."
        searchFn={(row, query) =>
          [
            row.name,
            userName(row.manager),
            userName(row.viceManager),
            peopleSummary(row.teamManagers),
            peopleSummary(row.members),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Edit department" : "Add department"}
        subtitle={editing?.name || "Set department leadership and membership"}
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
              form="department-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create department"}
            </button>
          </div>
        }
      >
        <form id="department-form" onSubmit={submit} className="space-y-5">
          <Field label="Department name" required>
            <TextInput
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={100}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Manager">
              <Select
                value={form.manager}
                onChange={(event) => setForm({ ...form, manager: event.target.value })}
              >
                <option value="">Unassigned</option>
                {users
                  .filter((user) => user._id !== form.viceManager)
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {userOptionLabel(user)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Vice Manager">
              <Select
                value={form.viceManager}
                onChange={(event) => setForm({ ...form, viceManager: event.target.value })}
              >
                <option value="">Unassigned</option>
                {users
                  .filter((user) => user._id !== form.manager)
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {userOptionLabel(user)}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>

          <Field label="Team Managers">
            <select
              multiple
              size={5}
              value={form.teamManagers}
              onChange={(event) =>
                setForm({
                  ...form,
                  teamManagers: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {userOptionLabel(user)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Members">
            <select
              multiple
              size={7}
              value={form.members}
              onChange={(event) =>
                setForm({
                  ...form,
                  members: Array.from(event.target.selectedOptions, (option) => option.value),
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {userOptionLabel(user)}
                </option>
              ))}
            </select>
          </Field>
        </form>
      </Drawer>

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name || "Department details"}
        subtitle="Leadership and complete member list"
      >
        {viewing && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-brand-text">Leadership</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <PersonDetail label="Manager" user={viewing.manager} />
                <PersonDetail label="Vice Manager" user={viewing.viceManager} />
              </div>
              <PersonList label="Team Managers" people={viewing.teamManagers} />
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-brand-text">
                Members ({viewing.members?.length || 0})
              </h3>
              <PersonList label="Department members" people={viewing.members} />
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete department?"
        message={`Delete ${confirmDelete?.name || "this department"}? This action cannot be undone.`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </>
  );
}

function PersonDetail({ label, user }) {
  return (
    <div className="rounded-lg border border-brand-border p-3">
      <p className="text-xs text-brand-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-text">{userName(user)}</p>
      {user?.email && <p className="text-xs text-brand-muted">{user.email}</p>}
    </div>
  );
}

function PersonList({ label, people = [] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-brand-muted">{label}</h4>
      {people.length ? (
        <ul className="divide-y divide-brand-border border-y border-brand-border">
          {people.map((person, index) => (
            <li
              key={userId(person) || `${label}-${index}`}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="text-sm text-brand-text">{userName(person)}</span>
              {person?.email && <span className="text-xs text-brand-muted">{person.email}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-muted">No {label.toLowerCase()} assigned.</p>
      )}
    </div>
  );
}