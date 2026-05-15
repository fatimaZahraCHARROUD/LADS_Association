import React, { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  Clock,
} from "lucide-react";

import "../../Styles/events.css";

export default function Events() {
  const [activeFilter, setActiveFilter] = useState("all");

  const events = [
    {
      id: 1,
      title: "Leadership & Public Speaking",
      category: "upcoming",
      date: "20 May 2026",
      time: "15:00",
      location: "Berkane",
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
      description:
        "Interactive workshop focused on communication and leadership skills.",
    },

    {
      id: 2,
      title: "Social Entrepreneurship Bootcamp",
      category: "upcoming",
      date: "28 May 2026",
      time: "10:00",
      location: "Oujda",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
      description:
        "Learn how to transform ideas into impactful social projects.",
    },

    {
      id: 3,
      title: "Youth Innovation Summit",
      category: "past",
      date: "10 April 2026",
      time: "14:00",
      location: "Rabat",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
      description:
        "A networking and innovation event bringing together young leaders.",
    },
  ];

  const filteredEvents =
    activeFilter === "all"
      ? events
      : events.filter(
          (event) => event.category === activeFilter
        );

  return (
    <section className="events-page">
      {/* HERO */}
      <div className="events-hero">
        <div className="container hero-content">
          <span className="hero-badge">
            L.A.D.S Events
          </span>

          <h1>
            Our <span>Events</span>
          </h1>

          <p>
            Explore workshops, conferences, and youth
            initiatives designed to inspire leadership and
            innovation.
          </p>
        </div>
      </div>

      <div className="container">
        {/* TOP BAR */}
        <div className="events-topbar">
          {/* SEARCH */}
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search events..."
            />
          </div>

          {/* FILTERS */}
          <div className="filters">
            <button
              className={
                activeFilter === "all" ? "active" : ""
              }
              onClick={() => setActiveFilter("all")}
            >
              All
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
              Upcoming
            </button>

            <button
              className={
                activeFilter === "past" ? "active" : ""
              }
              onClick={() => setActiveFilter("past")}
            >
              Past
            </button>
          </div>
        </div>

        {/* EVENTS GRID */}
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div className="event-card" key={event.id}>
              <div className="event-image">
                <img
                  src={event.image}
                  alt={event.title}
                />

                <span className={event.category}>
                  {event.category}
                </span>
              </div>

              <div className="event-content">
                <h3>{event.title}</h3>

                <p>{event.description}</p>

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

                <div className="event-buttons">
                  <button className="details-btn">
                    View Details
                  </button>

                  <button className="register-btn">
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}