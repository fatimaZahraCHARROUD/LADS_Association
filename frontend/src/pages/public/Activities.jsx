import React, { useState } from "react";
import {
  Search,
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";

import "../../Styles/activities.css";

export default function Activities() {
  const [activeFilter, setActiveFilter] =
    useState("all");

  const activities = [
    {
      id: 1,
      title: "Youth Leadership Training",
      category: "upcoming",
      date: "18 May 2026",
      location: "Berkane",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
      description:
        "Interactive leadership activities designed for young future leaders.",
    },

    {
      id: 2,
      title: "Community Volunteering Day",
      category: "past",
      date: "12 April 2026",
      location: "Oujda",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
      description:
        "Social volunteering initiative supporting local communities.",
    },

    {
      id: 3,
      title: "Innovation & Startup Workshop",
      category: "upcoming",
      date: "28 May 2026",
      location: "Nador",
      image:
        "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop",
      description:
        "Hands-on activities focused on entrepreneurship and innovation.",
    },
  ];

  const filteredActivities =
    activeFilter === "all"
      ? activities
      : activities.filter(
          (activity) =>
            activity.category === activeFilter
        );

  return (
    <section className="activities-page">
      {/* HERO */}
      <div className="activities-hero">
        <div className="container hero-content">
          <span className="hero-badge">
            L.A.D.S Activities
          </span>

          <h1>
            Our <span>Activities</span>
          </h1>

          <p>
            Discover our educational, social, and leadership
            activities designed to empower youth and create
            positive impact.
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
              placeholder="Search activities..."
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

        {/* ACTIVITIES GRID */}
        <div className="activities-grid">
          {filteredActivities.map((activity) => (
            <div
              className="activity-card"
              key={activity.id}
            >
              <div className="activity-image">
                <img
                  src={activity.image}
                  alt={activity.title}
                />

                <span className={activity.category}>
                  {activity.category}
                </span>
              </div>

              <div className="activity-content">
                <h3>{activity.title}</h3>

                <p>{activity.description}</p>

                <div className="activity-info">
                  <span>
                    <CalendarDays size={16} />
                    {activity.date}
                  </span>

                  <span>
                    <MapPin size={16} />
                    {activity.location}
                  </span>
                </div>

                <button className="details-btn">
                  View Details
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}