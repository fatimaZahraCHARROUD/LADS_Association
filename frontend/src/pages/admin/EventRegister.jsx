import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { mlDisplay } from "../../utils/i18n";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import RowActions from "../../components/admin/RowActions";
import { Select } from "../../components/admin/FormField";

export default function AdminEventRegister() {
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const path = eventFilter
        ? `/event-registrations?eventId=${eventFilter}`
        : "/event-registrations";
      const [regs, evts] = await Promise.all([
        api.get(path),
        api.get("/events").catch(() => []),
      ]);
      setRows(Array.isArray(regs) ? regs : []);
      setEvents(Array.isArray(evts) ? evts : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const eventLookup = useMemo(() => {
    const m = new Map();
    events.forEach((e) => m.set(e._id, e));
    return m;
  }, [events]);

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/event-registrations/${confirmDelete._id}`);
      toast.success("Registration deleted");
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
      key: "event",
      header: "Event",
      render: (r) => {
        const ev = eventLookup.get(typeof r.eventId === "object" ? r.eventId?._id : r.eventId);
        return (
          <div className="font-medium text-brand-text">
            {ev ? mlDisplay(ev.title) : "—"}
          </div>
        );
      },
    },
    {
      key: "fullName",
      header: "Name",
      render: (r) => r.fullName,
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
      key: "registrationDate",
      header: "Registered",
      render: (r) => (
        <span className="text-brand-muted">
          {r.registrationDate
            ? new Date(r.registrationDate).toLocaleString()
            : r.createdAt
            ? new Date(r.createdAt).toLocaleString()
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      tdClassName: "text-right",
      render: (r) => <RowActions onDelete={() => setConfirmDelete(r)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Event Registrations"
        subtitle="Participants registered to upcoming events."
      >
        <Select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="min-w-[14rem]"
        >
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e._id} value={e._id}>
              {mlDisplay(e.title)}
            </option>
          ))}
        </Select>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search registrations..."
        searchFn={(r, q) =>
          (r.fullName || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q)
        }
        emptyMessage="No registrations yet."
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete registration?"
        message={
          confirmDelete
            ? `${confirmDelete.fullName}'s registration will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />
    </>
  );
}
