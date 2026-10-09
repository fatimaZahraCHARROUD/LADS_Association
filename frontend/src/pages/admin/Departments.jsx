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
  const name = `${userName(user)} (${user.email})`;
  const roles = Array.isArray(user.role) ? user.role : [];
  const globalRoles = roles.filter((r) =>
    ["President", "Director Executive"].includes(r),
  );
  if (!globalRoles.length) return name;
  return `${name} · ${globalRoles.join(", ")}`;
}

function toggleInArray(list, value) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
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

  // ── Derived: filtered user lists to prevent duplication ──
  const availableManagers = users.filter(
    (user) => user._id !== form.viceManager,
  );

  const availableViceManagers = users.filter(
    (user) => user._id !== form.manager,
  );

  const availableTeamManagers = users.filter(
    (user) =>
      user._id !== form.manager && user._id !== form.viceManager,
  );

  const availableMembers = users.filter(
    (user) =>
      user._id !== form.manager &&
      user._id !== form.viceManager &&
      !form.teamManagers.includes(user._id),
  );

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
                onChange={(event) =>
                  setForm({ ...form, manager: event.target.value })
                }
              >
                <option value="">Unassigned</option>
                {availableManagers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {userOptionLabel(user)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Vice Manager">
              <Select
                value={form.viceManager}
                onChange={(event) =>
                  setForm({ ...form, viceManager: event.target.value })
                }
              >
                <option value="">Unassigned</option>
                {availableViceManagers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {userOptionLabel(user)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Team Managers">
            <CheckboxList
              users={availableTeamManagers}
              selected={form.teamManagers}
              onToggle={(id) =>
                setForm({
                  ...form,
                  teamManagers: toggleInArray(form.teamManagers, id),
                  // If a user is removed from team managers, ensure they
                  // don't linger in members as well (optional safety).
                  members: form.members.filter((m) => m !== id),
                })
              }
              emptyMessage="All users are already assigned as Manager or Vice Manager."
            />
          </Field>

          <Field label="Members">
            <CheckboxList
              users={availableMembers}
              selected={form.members}
              onToggle={(id) =>
                setForm({
                  ...form,
                  members: toggleInArray(form.members, id),
                })
              }
              emptyMessage="All users are already assigned as Manager, Vice Manager, or Team Manager."
            />
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

// ── New: checkbox list for multi-select fields ──
function CheckboxList({ users = [], selected = [], onToggle, emptyMessage }) {
  if (!users.length) {
    return (
      <p className="text-sm text-brand-muted">
        {emptyMessage || "No users available."}
      </p>
    );
  }

  const isGlobalRole = (user) => {
    const roles = Array.isArray(user.role) ? user.role : [];
    return roles.some((r) =>
      ["President", "Director Executive"].includes(r),
    );
  };

  // Global-role users first, then everyone else (stable within groups)
  const sortedUsers = [...users].sort((a, b) => {
    const aGlobal = isGlobalRole(a) ? 0 : 1;
    const bGlobal = isGlobalRole(b) ? 0 : 1;
    return aGlobal - bGlobal;
  });

  return (
    <div className="max-h-60 overflow-y-auto rounded-lg border border-brand-border bg-white">
      <ul className="divide-y divide-brand-border">
        {sortedUsers.map((user) => {
          const checked = selected.includes(user._id);
          const global = isGlobalRole(user);
          return (
            <li key={user._id}>
              <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(user._id)}
                  className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                />
                <span
                  className={
                    global
                      ? "text-sm text-red-600 font-medium"
                      : "text-sm text-brand-text"
                  }
                >
                  {userCheckboxLabel(user)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function userCheckboxLabel(user) {
  const name = `${userName(user)} (${user.email})`;
  const roles = Array.isArray(user.role) ? user.role : [];
  const globalRoles = roles.filter((r) =>
    ["President", "Director Executive"].includes(r),
  );
  return globalRoles.length ? `${name} · ${globalRoles.join(", ")}` : name;
}