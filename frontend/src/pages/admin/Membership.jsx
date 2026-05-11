import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";

export default function AdminMembership() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/membership-requests/${confirmDelete._id}`);
      toast.success("Request deleted");
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
      key: "fullName",
      header: "Name",
      render: (r) => (
        <div className="font-medium text-brand-text">{r.fullName}</div>
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
        <RowActions onDelete={() => setConfirmDelete(r)} />
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
          (r.city || "").toLowerCase().includes(q)
        }
        emptyMessage="No membership requests yet."
      />

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
