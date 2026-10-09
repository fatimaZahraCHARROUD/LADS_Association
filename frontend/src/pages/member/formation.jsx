import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Search,
  CalendarDays,
  Clock,
  Building2,
  GraduationCap,
  ExternalLink,
} from "lucide-react";

import { api } from "../../services/api";
import { mlDisplay } from "../../utils/i18n";
import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const CATEGORY_LABELS = {
  SoftSkills: "Soft Skills",
  MediaAndDigital: "Media & Digital",
  Social: "Social",
  Entrepreneurship: "Entrepreneurship",
};

const isHttpUrl = (u) => /^https?:\/\//i.test(u || "");

function statusVariant(status) {
  if (status === "completed") return "completed";
  if (status === "ongoing") return "ongoing";
  return "upcoming";
}

export default function MemberFormations() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "fr").slice(0, 2);

  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [onlyRecorded, setOnlyRecorded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get("/member/formations");
        setFormations(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (v) => {
    const d = new Date(v);
    return isNaN(d) ? v || "—" : d.toLocaleDateString(i18n.language);
  };

  const q = search.trim().toLowerCase();

  const filtered = formations
    .filter((f) => status === "all" || f.status === status)
    .filter((f) => !onlyRecorded || isHttpUrl(f.driveUrl))
    .filter((f) => {
      if (!q) return true;
      const text = [
        mlDisplay(f.title, lang, ""),
        mlDisplay(f.description, lang, ""),
        CATEGORY_LABELS[f.category] || f.category || "",
        f.departmentId?.name || "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });

  return (
    <>
      <PageHeader
        title="Formations"
        subtitle="Browse the trainings of the association and open their recordings."
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center gap-2 bg-white border border-brand-border rounded-xl px-3 py-2.5 w-full lg:max-w-sm">
          <Search size={16} className="text-brand-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search formations..."
            className="w-full text-sm bg-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === f.value
                  ? "bg-brand-primary text-white"
                  : "bg-white border border-brand-border text-brand-text hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm text-brand-text ml-1 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyRecorded}
              onChange={(e) => setOnlyRecorded(e.target.checked)}
            />
            Recording available
          </label>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-sm text-brand-muted">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-muted">No formations found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => (
            <article
              key={f._id}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              {f.imgUrl ? (
                <img
                  src={f.imgUrl}
                  alt={mlDisplay(f.title, lang, "")}
                  className="w-full h-44 object-cover"
                />
              ) : (
                <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 text-white">
                  <GraduationCap size={48} />
                </div>
              )}

              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-brand-text leading-snug">
                    {mlDisplay(f.title, lang)}
                  </h3>
                  <StatusBadge variant={statusVariant(f.status)}>
                    {f.status}
                  </StatusBadge>
                </div>

                <p
                  className="text-sm text-brand-muted"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {mlDisplay(f.description, lang, "")}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-brand-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} />
                    {fmtDate(f.date)}
                  </span>
                  {f.heure && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} />
                      {f.heure}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Building2 size={15} />
                    {f.departmentId?.name ||
                      CATEGORY_LABELS[f.category] ||
                      "L.A.D.S"}
                  </span>
                </div>

                <div className="mt-auto pt-2">
                  {isHttpUrl(f.driveUrl) ? (
                    <a
                      href={f.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      <ExternalLink size={15} />
                      Open recording
                    </a>
                  ) : (
                    <span className="text-sm text-brand-muted">
                      Recording not available yet.
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
