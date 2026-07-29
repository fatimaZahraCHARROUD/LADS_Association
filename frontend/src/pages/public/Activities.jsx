import React, { useState, useEffect } from "react";

import {
  Search,
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../Styles/activities.css";

import { api } from "../../services/api";

import { mlDisplay } from "../../utils/i18n";

export default function Activities() {

const { t, i18n } = useTranslation();
const navigate=useNavigate();
  const [activeFilter, setActiveFilter] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
const [selectedActivity, setSelectedActivity] = useState(null);  useState(null);
  /* =========================
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

        const res =
          await api.get("/activities?isPublished=true");

        const data =
          Array.isArray(res)
            ? res
            : res?.data || [];

        setActivities(data);

      } catch (err) {

        console.error(
          "Activities error:",
          err
        );

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);

  /* =========================
      FILTER
  ========================= */
  const filteredActivities = activities

    .filter((a) => {

      if (activeFilter === "all")
        return true;

      if (activeFilter === "past")
        return a.status === "completed";

      if (activeFilter === "upcoming")
        return a.status === "upcoming";

      return true;

    })

    .filter((a) => {

      const q =
        search.toLowerCase();

      return (

        mlDisplay(a.title, i18n.language)
          .toLowerCase()
          .includes(q)

        ||

        mlDisplay(a.description, i18n.language)
          .toLowerCase()
          .includes(q)

        ||

        (a.location || "")
          .toLowerCase()
          .includes(q)

      );

    });

  return (

    <section className="activities-page">

      {/* HERO */}
      <div className="activities-hero">

        <div className="container hero-content">

          <span className="hero-badge">
            {t("activities.hero.badge")}
          </span>

          <h1 >
            {t("activities.hero.title")}
          </h1>

          <p>
            {t("activities.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        {/* TOP BAR */}
        <div className="activities-topbar">

          {/* SEARCH */}
          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder={t("activities.search")}
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
              {t("activities.filters.all")}
            </button>

            <button
              className={
                activeFilter === "upcoming"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("upcoming")
              }
            >
              {t("activities.filters.upcoming")}
            </button>

            <button
              className={
                activeFilter === "past"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("past")
              }
            >
              {t("activities.filters.past")}
            </button>

          </div>

        </div>

        {/* GRID */}
        <div className="activities-grid">

          {
            filteredActivities.map((activity) => (

              <div
                className="activity-card"
                key={activity._id}  onClick={() => setSelectedActivity(activity)}
              >

                {/* IMAGE */}
                <div className="activity-image"  >

                  <img
                    src={activity.image}
                    alt={mlDisplay(activity.title, i18n.language)}
                  />

                  {/* <span className={activity.status}>

                    {
                      activity.status === "upcoming"
                        ? t("activities.status.upcoming")
                        : t("activities.status.past")
                    }

                  </span> */}

                </div>

                {/* CONTENT */}
                <div className="activity-content">

                  <h3>
                    {mlDisplay(activity.title, i18n.language)}
                  </h3>

                 

                  <div className="activity-info">

                    <span>
                      <CalendarDays size={16} />
                      {activity.activityDate}
                    </span>

                    <span>
                      <MapPin size={16} />
                      {activity.location}
                    </span>

                  </div>

                     <button className="join-btn" onClick={(e) => {
    e.stopPropagation();
     navigate("/membership")}}>
                      {t("formations.buttons.join")}
                    </button>
                  {/* <button className="details-btn">

                    {t("activities.buttons.details")}

                    <ArrowRight size={18} />

                  </button> */}

                </div>

              </div>

            ))
          }

        </div>

        {/* EMPTY */}
        {
          !loading &&
          filteredActivities.length === 0 && (

            <p>
              {t("activities.empty")}
            </p>

          )
        }

      </div>

{/* IMAGE MODAL */}
{
  selectedActivity && (

    <div
      className="image-modal"
      onClick={() => setSelectedActivity(null)}
    >

      <div
        className="image-modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-modal"
          onClick={() => setSelectedActivity(null)}
        >
          ✕
        </button>

        <img
          src={selectedActivity.image}
          alt={mlDisplay(selectedActivity.title, i18n.language)}
        />

        <div className="preview-content">

          <h2>
            {mlDisplay(selectedActivity.title, i18n.language)}
          </h2>

          

          <p>
            {mlDisplay(
              selectedActivity.description,
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