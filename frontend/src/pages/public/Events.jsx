import React, { useState, useEffect } from "react";

import {
  CalendarDays,
  MapPin,
  Search,
  Clock,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import "../../Styles/events.css";

import { api } from "../../services/api";

import { mlDisplay } from "../../utils/i18n";

export default function Events() {

const { t, i18n } = useTranslation();

  const [activeFilter, setActiveFilter] =
    useState("all");
const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] =
    useState("");

  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedEventPreview, setSelectedEventPreview] = useState(null);
  /* =========================
      FETCH EVENTS
  ========================= */
  useEffect(() => {

    const fetchData = async () => {

      try {

        const res =
          await api.get("/events?isPublished=true");

        const data =
          Array.isArray(res)
            ? res
            : res?.data || [];

        setEvents(data);

      } catch (err) {

        console.error("Events error:", err);

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);
const categories = [
  {
    key:"all",
    label:{
      en:"All categories",
      fr:"Toutes les catégories",
      ar:"كل التصنيفات"
    }
  },

  ...Array.from(
    new Map(
      events
      .filter(e => e.category)
      .map(e => [
        JSON.stringify(e.category),
        {
          key: JSON.stringify(e.category),
          label:e.category
        }
      ])
    ).values()
  )

];

useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
  const [selectedEvent, setSelectedEvent] = useState(null);

const [form, setForm] = useState({
  fullName: "",
  email: "",
  phone: "",
});
const handleChange = (e) => {
  setForm({
    ...form,
    [e.target.name]: e.target.value,
  });
};
const handleSubmit = async () => {
  try {
    await api.post("/event-registrations", {
      eventId: selectedEvent._id,
      ...form,
    });

    alert("Registered successfully!");

    setSelectedEvent(null);
    setForm({ fullName: "", email: "", phone: "" });

  } catch (err) {
    console.error(err);
  }
};
  /* =========================
      FILTER EVENTS
  ========================= */
const isPast = (eventDate) => {
  const event = new Date(eventDate);

  // keep event valid until end of day
  event.setHours(23, 59, 59, 999);

  return event < new Date();
};

const isEventPast = isPast;

const filteredEvents = events
  .filter((e) => {

    // Date filter
    if (activeFilter === "past") {
      return isPast(e.date);
    }

    if (activeFilter === "upcoming") {
      return !isPast(e.date);
    }

    return true;

  })
  .filter((e) => {

    // Category filter
    if (activeCategory === "all") {
      return true;
    }

return JSON.stringify(e.category) === activeCategory;
  })
  .filter((e) => {

    // Search
    const q = search.trim().toLowerCase();

    return (
      mlDisplay(e.title, i18n.language)
        ?.toLowerCase()
        .includes(q) ||

      mlDisplay(e.description, i18n.language)
        ?.toLowerCase()
        .includes(q) ||

      (e.location || "")
        .toLowerCase()
        .includes(q)
    );

  });

  return (

    <section className="events-page">

      {/* HERO */}
      <div className="events-hero">

        <div className="container hero-content">

          <span className="hero-badge">
            {t("events.hero.badge")}
          </span>

          <h1>
            {t("events.hero.title")}
          </h1>

          <p>
            {t("events.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        {/* TOPBAR */}
        <div className="events-topbar">
<select style={{"border":"1px solid lightgray", "borderRadius":"10px", "padding":"8px"}}
  value={activeCategory}
  onChange={(e) =>
    setActiveCategory(e.target.value)
  }
>
  {
categories.map((cat)=>(
<option
 key={cat.key}
 value={cat.key}
>
{
mlDisplay(
 cat.label,
 i18n.language
)
}
</option>
))
}
</select>
          {/* SEARCH */}
          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder={t("events.search")}
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
              {t("events.filters.all")}
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
              {t("events.filters.upcoming")}
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
              {t("events.filters.past")}
            </button>

          </div>

        </div>

        {/* EVENTS GRID */}
        <div className="events-grid">

          {
            filteredEvents.map((event) => {
                const past = isEventPast(event.date);
                return(
              <div
                className="event-card"
                key={event._id}
                  onClick={() => setSelectedEventPreview(event)}

              >

                {/* IMAGE */}
                <div className="event-image"  >

                  <img
                    src={event.coverImage}
                    alt={mlDisplay(event.title, i18n.language)}
                  />

                  {/* <span className={event.status}>

                    {
                      event.status === "upcoming"
                        ? t("events.status.upcoming")
                        : t("events.status.completed")
                    }

                  </span> */}

                </div>

                {/* CONTENT */}
                <div className="event-content">
{event.category && (
  <span className="event-category">
    {mlDisplay(event.category, i18n.language)}
  </span>
)}
                  <h3>
                    {mlDisplay(event.title, i18n.language)}
                  </h3>

                  

                

                  {/* INFO */}
                  <div className="event-info">

                    <span>
                      <CalendarDays size={16} />
                      {event.date}
                    </span>

                    <span>
                      <Clock size={16} />
                      {event.time}
                    </span>

                    <span>
                      <MapPin size={16} />
                      {event.location}
                    </span>

                  </div>

                  {/* BUTTONS */}
                  <div className="event-buttons">
                    
                    {/* <button className="details-btn">
                      {t("events.buttons.details")}
                    </button> */}
                   {!past && (
  <button
    type="button"
    className="register-btn"
    onClick={(e) => {
    e.stopPropagation();
    setSelectedEvent(event);
  }}
  >
    {t("events.buttons.register")}
  </button>
)}
                   

                  </div>

                </div>

              </div>
                );
              })}

        </div>

        {/* EMPTY */}
        {
          !loading &&
          filteredEvents.length === 0 && (

            <p className="empty-events">
              {t("events.empty")}
            </p>

          )
        }

      </div>


{/* IMAGE MODAL */}
{
  selectedEventPreview && (

    <div
      className="image-modal"
      onClick={() => setSelectedEventPreview(null)}
    >

      <div
        className="image-modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-modal"
          onClick={() => setSelectedEventPreview(null)}
        >
          ✕
        </button>

        <img
          src={selectedEventPreview.coverImage}
          alt={mlDisplay(
            selectedEventPreview.title,
            i18n.language
          )}
        />

        <h2>
          {mlDisplay(
            selectedEventPreview.title,
            i18n.language
          )}
        </h2>

        <p>
          {mlDisplay(
            selectedEventPreview.description,
            i18n.language
          )}
        </p>

      </div>

    </div>

  )
}
{selectedEvent && (
  <div className="image-modal" onClick={() => setSelectedEvent(null)}>

    <div
      className="image-modal-content"
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className="close-modal"
        onClick={() => setSelectedEvent(null)}
      >
        ✕
      </button>

      <h3>{mlDisplay(selectedEvent.title, i18n.language)}</h3>

      <input
        name="fullName"
        placeholder="Full Name"
        value={form.fullName}
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
      />

      <button onClick={handleSubmit}>
        Confirm Registration
      </button>

    </div>

  </div>
)}
    </section>

  );
}