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
const [selectedImage, setSelectedImage] =
  useState(null);
  /* =========================
      FETCH DATA
  ========================= */
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
                activeFilter === "leadership"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("leadership")
              }
            >
              {t("formations.filters.leadership")}
            </button>

            <button
              className={
                activeFilter === "digital"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("digital")
              }
            >
              {t("formations.filters.digital")}
            </button>

            <button
              className={
                activeFilter === "social"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("social")
              }
            >
              {t("formations.filters.social")}
            </button>

            <button
              className={
                activeFilter === "entrepreneurship"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter(
                  "entrepreneurship"
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
                key={f._id || f.id}
              >

               <div className="formation-image"   onClick={() => setSelectedImage(f.imgUrl)}>

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

                  <p>
                    {mlDisplay(f.description, i18n.language)}
                  </p>

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

                    <button className="join-btn" onClick={()=> navigate("/membership")}>
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
  selectedImage && (

    <div
      className="image-modal"
      onClick={() => setSelectedImage(null)}
    >

      <div
        className="image-modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-modal"
          onClick={() => setSelectedImage(null)}
        >
          ✕
        </button>

        <img
          src={selectedImage}
          alt="Formation"
        />

      </div>

    </div>

  )
}
    </section>

  );
}