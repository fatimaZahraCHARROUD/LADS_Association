import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Search,
  Clock,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import "../../Styles/formations.css";

import { mlDisplay } from "../../utils/i18n";

import { api } from "../../services/api";

export default function Formations() {
const navigate=useNavigate();
const { t, i18n } = useTranslation();

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [formations, setFormations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");
const [selectedFormation, setSelectedFormation] = useState(null);  /* =========================
      FETCH DATA
  ========================= */
 useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
  useEffect(() => {

    const fetchData = async () => {

      try {

        const data =
          await api.get("/formations?isPublished=true");

        setFormations(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);

  /* =========================
      FILTER
  ========================= */
  const filtered = formations

    .filter((f) => {

      if (activeFilter === "all")
        return true;

      return f.category === activeFilter;

    })

    .filter((f) => {

      const q =
        search.toLowerCase();

      return (

        mlDisplay(f.title, i18n.language)
          .toLowerCase()
          .includes(q)

        ||

        mlDisplay(f.description, i18n.language)
          .toLowerCase()
          .includes(q)

        ||

        (f.category || "")
          .toLowerCase()
          .includes(q)

      );

    });

  return (

    <section className="formations-page">

      {/* HERO */}
      <div className="formations-hero">

        <div className="container hero-content">

          <span className="hero-badge">
            {t("formations.hero.badge")}
          </span>

          <h1>
            {t("formations.hero.title")}
          </h1>

          <p>
            {t("formations.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        {/* TOP BAR */}
        <div className="formations-topbar">

          {/* SEARCH */}
          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder={t("formations.search")}
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {/* FILTERS */}
          <div className="filters">

            <button
              className={
                activeFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("all")
              }
            >
              {t("formations.filters.all")}
            </button>

            <button
              className={
                activeFilter === "Soft Skills"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("SoftSkills")
              }
            >
              {t("formations.filters.SoftSkills")}
            </button>

            <button
              className={
                activeFilter === "MediaAndDigital"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("MediaAndDigital")
              }
            >
              {t("formations.filters.digital")}
            </button>

            <button
              className={
                activeFilter === "Social"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("Social")
              }
            >
              {t("formations.filters.social")}
            </button>

            <button
              className={
                activeFilter === "Entrepreneurship"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter(
                  "Entrepreneurship"
                )
              }
            >
              {t("formations.filters.entrepreneurship")}
            </button>

          </div>

        </div>

        {/* GRID */}
        <div className="formations-grid">

          {
            filtered.map((f) => (

              <div
                className="formation-card"
                key={f._id || f.id} onClick={() => setSelectedFormation(f)}
              >

               <div className="formation-image"   >

  <img
    src={f.imgUrl}
    alt={mlDisplay(f.title, i18n.language)}
  />

</div>

<div className="formation-content">

  <div className="formation-title-row">

    <h3>
      {mlDisplay(f.title, i18n.language)}
    </h3>

    <span className={`tag ${f.category}`}>
      {t(`formations.categories.${f.category}`) || f.category}
    </span>

  </div>

                  

                  <div className="formation-info">

                    <span>
                      <CalendarDays size={16} />
                      {f.date}
                    </span>

                    <span>
                      <Clock size={16} />
                      {f.heure}
                    </span>

                  </div>

                  <div className="formation-buttons">

                    {/* <button className="details-btn">
                      {t("formations.buttons.details")}
                    </button> */}

                    <button className="join-btn" onClick={(e) => {
    e.stopPropagation();
     navigate("/membership")}}>
                      {t("formations.buttons.join")}
                    </button>

                  </div>

                </div>

              </div>

            ))
          }

        </div>

      </div>



{/* IMAGE MODAL */}
{
  selectedFormation && (

    <div
      className="image-modal"
      onClick={() => setSelectedFormation(null)}
    >

      <div
        className="image-modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-modal"
          onClick={() => setSelectedFormation(null)}
        >
          ✕
        </button>

        <img
          src={selectedFormation.imgUrl}
          alt={mlDisplay(
            selectedFormation.title,
            i18n.language
          )}
        />

        <div className="preview-content">

          <h2>
            {mlDisplay(
              selectedFormation.title,
              i18n.language
            )}
          </h2>
  
          <p>
            {mlDisplay(
              selectedFormation.description,
              i18n.language
            )}
          </p>

        </div>

      </div>

    </div>

  )
}
    </section>

  );
}