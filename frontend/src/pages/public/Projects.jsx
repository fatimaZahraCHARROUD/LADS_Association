import { useEffect, useState } from "react";
import { Search, CalendarDays, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import "../../utils/projectsI18n";
import "../../Styles/projects.css";
import { api } from "../../services/api";

const FILTERS = ["all", "in_progress", "completed", "planned"];

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

function Progress({ value, label }) {
  const v = clamp(value);
  return (
    <div className="project-progress">
      <div className="project-progress-head">
        <span>{label}</span>
        <span>{v}%</span>
      </div>
      <div className="project-progress-bar">
        <div className="project-progress-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default function Projects() {
  const { t, i18n } = useTranslation();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get("/public/projects");
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fmt = (v) => (v ? new Date(v).toLocaleDateString(i18n.language) : "—");

  const q = search.trim().toLowerCase();

  const filtered = projects
    .filter((p) => activeFilter === "all" || p.status === activeFilter)
    .filter(
      (p) =>
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.departmentId?.name || "").toLowerCase().includes(q)
    );

  return (
    <section className="projects-page">
      {/* HERO */}
      <div className="projects-hero">
        <div className="projects-container projects-hero-content">
          <span className="projects-hero-badge">{t("projects.hero.badge")}</span>
          <h1>{t("projects.hero.title")}</h1>
          <p>{t("projects.hero.desc")}</p>
        </div>
      </div>

      <div className="projects-container">
        {/* TOP BAR */}
        <div className="projects-topbar">
          <div className="projects-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={t("projects.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="projects-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={activeFilter === f ? "active" : ""}
                onClick={() => setActiveFilter(f)}
              >
                {t(`projects.filters.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <p className="projects-empty">{t("projects.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="projects-empty">{t("projects.empty")}</p>
        ) : (
          <div className="projects-grid">
            {filtered.map((p) => (
              <div
                className="project-card"
                key={p._id}
                onClick={() => setSelected(p)}
              >
                <div className="project-image">
                  {p.img ? (
                    <img src={p.img} alt={p.title} />
                  ) : (
                    <div className="project-image-placeholder">
                      {(p.title || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="project-content">
                  <div className="project-title-row">
                    <h3>{p.title}</h3>
                    <span className={`project-tag ${p.status}`}>
                      {t(`projects.status.${p.status}`)}
                    </span>
                  </div>

                  <p className="project-desc">{p.description}</p>

                  <div className="project-info">
                    
                    <span>
                      <Building2 size={16} />
                      { t("projects.general")}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {selected && (
        <div className="project-modal" onClick={() => setSelected(null)}>
          <div
            className="project-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="project-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ✕
            </button>

            {selected.img && <img src={selected.img} alt={selected.title} />}

            <div className="project-modal-body">
              <div className="project-title-row">
                <h2>{selected.title}</h2>
                <span className={`project-tag ${selected.status}`}>
                  {t(`projects.status.${selected.status}`)}
                </span>
              </div>

              <p>{selected.description}</p>

              <div className="project-info">
                <span>
                  <CalendarDays size={16} />
                  {t("projects.period")} : {fmt(selected.startDate)} →{" "}
                  {fmt(selected.endDate)}
                </span>
                <span>
                  <Building2 size={16} />
                  {t("projects.department")} :{" "}
                  {selected.departmentId?.name || t("projects.general")}
                </span>
              </div>

              <Progress value={selected.progress} label={t("projects.progress")} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
