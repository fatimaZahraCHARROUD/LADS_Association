import React from "react";
import {
  CalendarDays,
  ArrowRight,
  Search,
} from "lucide-react";

import "../../Styles/news.css";

export default function News() {
  const mainNews = {
    title:
      "L.A.D.S Launches New Youth Leadership Program",
    category: "Leadership",
    date: "10 May 2026",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
    description:
      "A new initiative focused on empowering youth with leadership, communication, and entrepreneurship skills through workshops and mentoring sessions.",
  };

  const sideNews = [
    {
      id: 1,
      title:
        "Social Entrepreneurship Workshop Successfully Completed",
      category: "Entrepreneurship",
      date: "02 May 2026",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: 2,
      title:
        "Community Volunteering Initiative in Berkane",
      category: "Social Action",
      date: "20 April 2026",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
    },

    {
      id: 3,
      title:
        "Innovation & Startup Activities for Students",
      category: "Innovation",
      date: "14 April 2026",
      image:
        "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <section className="news-page">
      {/* HERO */}
      <div className="news-hero">
        <div className="container hero-content">
          <span className="hero-badge">
            L.A.D.S News
          </span>

          <h1>
            Latest <span>News</span>
          </h1>

          <p>
            Follow our latest updates, events, workshops,
            and community initiatives.
          </p>
        </div>
      </div>

      <div className="container">
        {/* TOP BAR */}
        <div className="news-topbar">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search articles..."
            />
          </div>

          <div className="categories">
            <button className="active">All</button>
            <button>Leadership</button>
            <button>Innovation</button>
            <button>Social Action</button>
          </div>
        </div>

        {/* NEWS LAYOUT */}
        <div className="news-layout">
          {/* MAIN NEWS */}
          <div className="main-news">
            <img
              src={mainNews.image}
              alt={mainNews.title}
            />

            <div className="main-news-content">
              <span className="news-category">
                {mainNews.category}
              </span>

              <div className="news-date">
                <CalendarDays size={16} />
                {mainNews.date}
              </div>

              <h2>{mainNews.title}</h2>

              <p>{mainNews.description}</p>

              <button className="read-btn">
                Read Article
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* SIDE NEWS */}
          <div className="side-news">
            {sideNews.map((item) => (
              <div
                className="side-news-card"
                key={item.id}
              >
                <img
                  src={item.image}
                  alt={item.title}
                />

                <div className="side-news-content">
                  <span>{item.category}</span>

                  <div className="news-date small">
                    <CalendarDays size={14} />
                    {item.date}
                  </div>

                  <h3>{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}