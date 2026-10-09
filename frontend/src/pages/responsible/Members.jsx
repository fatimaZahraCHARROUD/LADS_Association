import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail, MapPin,Phone } from "lucide-react";
import { api, API_BASE } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";

const FULL_PHOTO = (p) =>
  p && !p.startsWith("http") ? `${API_BASE}${p}` : p || "";

// Page "Members" du Responsable :
// lecture seule. Le backend renvoie UNIQUEMENT les membres de SES cellules.
export default function RespMembers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");

  const load = async (n = nom) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (n) qs.set("nom", n);
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
      key: "deptRole",
      header: "Role",
      render: (r) => {
        const label = r.deptRole || "Member";
        const styles =
          label === "Manager"
            ? "bg-purple-100 text-purple-700"
            : label === "Vice Manager"
              ? "bg-blue-100 text-blue-700"
              : label === "Team Manager"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-700";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
          >
            {label}
          </span>
        );
      },
    }
    ,{
      key: "email",
      header: "Email",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <Mail size={13} />
          {r.email}
        </span>
      ),
    }
     ,{
      key: "phone",
      header: "Phone",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-brand-muted">
          <Phone size={13} />
          {r.phone || "—"}
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
      key: "situation",
      header: "Poste",
      render: (r) => (r.situation || "—"),
    },
  ];

  const fieldClass =
    "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/30";

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Members of the departments you manage."
      />

      {/* <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by name..."
          className={fieldClass + " md:max-w-xs"}
        />
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors"
        >
          Apply filter
        </button>
      </div> */}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchFn={(r, q) =>
          (r.fullName || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.membershipNumber || "").toLowerCase().includes(q)
        }
        emptyMessage="No members in your department."
      />
    </>
  );
}