import React, { useState } from "react";
import { CalendarDays, MapPin, Search, Clock } from "lucide-react";
import "../../Styles/formations.css";

export default function Formations() {
  const [activeFilter, setActiveFilter] = useState("all");

  const formations = [
    {
      id: 1,
      title: "Leadership & Public Speaking",
      category: "leadership",
      date: "20 May 2026",
      time: "15:00",
      location: "Berkane",
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
      description:
        "Develop leadership mindset and powerful communication skills.",
    },
    {
      id: 2,
      title: "Digital Skills Bootcamp",
      category: "digital",
      date: "28 May 2026",
      time: "10:00",
      location: "Oujda",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
      description:
        "Learn modern digital tools, productivity and tech essentials.",
    },
    {
      id: 3,
      title: "Social Entrepreneurship",
      category: "social",
      date: "10 June 2026",
      time: "14:00",
      location: "Rabat",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
      description:
        "Turn social problems into impactful business solutions.",
    },
    {
      id: 4,
      title: "Startup & Entrepreneurship",
      category: "entrepreneurship",
      date: "15 June 2026",
      time: "09:30",
      location: "Casablanca",
      image:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop",
      description:
        "Build, validate and launch your startup idea.",
    },
  ];

  const filtered =
    activeFilter === "all"
      ? formations
      : formations.filter((f) => f.category === activeFilter);

  return (
    <section className="formations-page">
      {/* HERO */}
      <div className="formations-hero">
        <div className="container hero-content">
          <span className="hero-badge">L.A.D.S Formations</span>

          <h1>
            Our <span>Formations</span>
          </h1>

          <p>
            Build your skills through practical workshops in leadership,
            digital, social impact and entrepreneurship.
          </p>
        </div>
      </div>

      <div className="container">
        {/* TOP BAR */}
        <div className="formations-topbar">
          {/* SEARCH */}
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search formations..." />
          </div>

          {/* FILTERS */}
          <div className="filters">
            <button
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>

            <button
              className={activeFilter === "leadership" ? "active" : ""}
              onClick={() => setActiveFilter("leadership")}
            >
              Leadership
            </button>

            <button
              className={activeFilter === "digital" ? "active" : ""}
              onClick={() => setActiveFilter("digital")}
            >
              Digital
            </button>

            <button
              className={activeFilter === "social" ? "active" : ""}
              onClick={() => setActiveFilter("social")}
            >
              Social
            </button>

            <button
              className={activeFilter === "entrepreneurship" ? "active" : ""}
              onClick={() => setActiveFilter("entrepreneurship")}
            >
              Entrepreneurship
            </button>
          </div>
        </div>

        {/* GRID */}
        <div className="formations-grid">
          {filtered.map((f) => (
            <div className="formation-card" key={f.id}>
              <div className="formation-image">
                <img src={f.image} alt={f.title} />
                <span className={f.category}>{f.category}</span>
              </div>

              <div className="formation-content">
                <h3>{f.title}</h3>
                <p>{f.description}</p>

                <div className="formation-info">
                  <span>
                    <CalendarDays size={16} />
                    {f.date}
                  </span>
                  <span>
                    <Clock size={16} />
                    {f.time}
                  </span>
                  <span>
                    <MapPin size={16} />
                    {f.location}
                  </span>
                </div>

                <div className="formation-buttons">
                  <button className="details-btn">Details</button>
                  <button className="join-btn">Join</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}