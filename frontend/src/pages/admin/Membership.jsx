import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Drawer from "../../components/admin/Drawer";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import { useNotifications } from "../../contexts/NotificationsContext";

export default function AdminMembership() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
const { setCounts } = useNotifications();

  const load = async () => {
    try {
      const data = await api.get("/membership-requests");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

 const openView = async (row) => {
  setViewing(row);

  // already read
  if (row.readAt) return;

  // update topbar instantly
  setCounts((prev) => ({
    ...prev,
    memberships: Math.max(0, prev.memberships - 1),
  }));

  try {
    await api.patch(`/membership-requests/${row._id}/read`, {});

    setRows((prev) =>
      prev.map((r) =>
        r._id === row._id
          ? { ...r, readAt: new Date().toISOString() }
          : r
      )
    );
  } catch {
    // non-critical
  }
};

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/membership-requests/${confirmDelete._id}`);
      toast.success("Request deleted");
      setConfirmDelete(null);
      if (viewing && viewing._id === confirmDelete._id) setViewing(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "fullName",
      header: "Name",
      render: (r) => (
        <div className="flex items-center gap-2">
          {!r.readAt && (
            <span
              className="w-2 h-2 rounded-full bg-brand-primary shrink-0"
              title="Unread"
            />
          )}
          <div
            className={
              r.readAt
                ? "font-medium text-brand-text"
                : "font-semibold text-brand-text"
            }
          >
            {r.fullName}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (r) => <span className="text-brand-muted">{r.email}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (r) => r.phone || "—",
    },
    {
      key: "city",
      header: "City",
      render: (r) => r.city || "—",
    },
    {
      key: "createdAt",
      header: "Received",
      render: (r) => (
        <span className="text-brand-muted">
          {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => (
        <RowActions
          onView={() => openView(r)}
          onDelete={() => setConfirmDelete(r)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Membership Requests"
        subtitle="People who want to join LADS."
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search requests..."
        searchFn={(r, q) =>
          (r.fullName || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.city || "").toLowerCase().includes(q) ||
          (r.motivation || "").toLowerCase().includes(q)
        }
        emptyMessage="No membership requests yet."
      />

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.fullName || "Request"}
        subtitle={viewing?.email || "Membership request"}
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
                onClick={() => setConfirmDelete(viewing)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-danger hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <Row icon={<Mail size={14} />} label="Email" value={viewing.email} />
              <Row icon={<Phone size={14} />} label="Phone" value={viewing.phone || "—"} />
              <Row icon={<MapPin size={14} />} label="City" value={viewing.city || "—"} />
              <Row
                icon={<Calendar size={14} />}
                label="Received"
                value={viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : "—"}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-brand-text mb-2">Motivation</h3>
              <p className="whitespace-pre-wrap text-sm text-brand-text bg-white border border-brand-border rounded-lg p-3 leading-relaxed">
                {viewing.motivation || <span className="text-brand-muted italic">No motivation provided.</span>}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete request?"
        message={
          confirmDelete
            ? `The membership request from ${confirmDelete.fullName} will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-brand-muted w-20 shrink-0 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-brand-text break-all">{value}</span>
    </div>
  );
}
