import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Mail, MapPin } from "lucide-react";
import { api, API_BASE } from "../../services/api";

import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";

const FULL_PHOTO = (p) =>
  p && !p.startsWith("http") ? `${API_BASE}${p}` : p || "";

// Page "Members" du Directeur Exécutif :
// lecture SEULE (pas de bouton ajouter/modifier) + filtre par département.
export default function ExecMembers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ nom: "", departement: "" });

  // Liste complète pour construire le menu déroulant des départements
  const [deptOptions, setDeptOptions] = useState([]);

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

  // Au montage, on charge la liste complète UNE FOIS pour avoir
  // tous les départements dans le menu déroulant (même après un filtre).
  useEffect(() => {
    let cancelled = false;
    api
      .get("/members/search")
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setDeptOptions(
          [...new Set(list.flatMap((r) => r.departement || []))].filter(Boolean)
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const departements = useMemo(() => deptOptions, [deptOptions]);

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
    // {
    //   key: "departement",
    //   header: "Dept",
    //   render: (r) => (r.departement?.[0] || "—"),
    // },
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
  ];

  const fieldClass =
    "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/30";

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="View all LADS association members."
      />

      {/* <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={filters.nom}
          onChange={(e) => setFilters((f) => ({ ...f, nom: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by name..."
          className={fieldClass + " md:max-w-xs"}
        />
        <select
          value={filters.departement}
          onChange={(e) =>
            setFilters((f) => ({ ...f, departement: e.target.value }))
          }
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
        emptyMessage="No members found."
      />
    </>
  );
}