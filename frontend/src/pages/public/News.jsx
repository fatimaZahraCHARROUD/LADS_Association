import React, { useState, useEffect } from "react";

import {
  CalendarDays,
  ArrowRight,
  Search,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import "../../Styles/news.css";

import { api } from "../../services/api";

import { mlDisplay } from "../../utils/i18n";
import { useNavigate } from "react-router-dom";

export default function News() {

const { t, i18n } = useTranslation();
const navigate = useNavigate();
  const [news, setNews] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

    const [selectedImage, setSelectedImage] =
  useState(null);
  /* =====================
      FETCH NEWS
  ===================== */
  useEffect(() => {

    const fetchData = async () => {

      try {

        const res =
          await api.get("/news?isPublished=true");

        const data =
          Array.isArray(res)
            ? res
            : res?.data || [];

        setNews(data);

      } catch (err) {

        console.error("News error:", err);

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);
const goToNews = (id) => {
  navigate(`/news/${id}`);
};
  const mainNews =
    news[0] || null;

  const filteredNews =
    news.slice(1)

      .filter((n) => {

        if (activeCategory === "all")
          return true;

        return (n.tags || [])
          .includes(activeCategory);

      })

      .filter((n) => {

        const q =
          search.trim().toLowerCase();

        return (

          mlDisplay(n.title, i18n.language)
            .toLowerCase()
            .includes(q)

          ||

          mlDisplay(n.content, i18n.language)
            .toLowerCase()
            .includes(q)

          ||

          (n.tags || [])
            .join(" ")
            .toLowerCase()
            .includes(q)

        );

      });

  const categories = [
    "all",
    "Leadership",
    "Innovation",
    "Social Action",
  ];

  return (

    <section className="news-page">

      {/* HERO */}
      <div className="news-hero">

        <div className="container hero-content">

          <span className="hero-badge">
            {t("news.hero.badge")}
          </span>

          <h1>
            {t("news.hero.title")}
          </h1>

          <p>
            {t("news.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        {/* TOP BAR */}
        <div className="news-topbar">

          {/* SEARCH */}
          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder={t("news.search")}
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {/* CATEGORIES */}
          <div className="categories">

            {categories.map((cat) => (

              <button
                key={cat}
                className={
                  activeCategory === cat
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(cat)
                }
              >

                {t(`news.categories.${cat}`)}

              </button>

            ))}

          </div>

        </div>

        {/* NEWS LAYOUT */}
        <div className="news-layout">

          {/* MAIN NEWS */}
          {mainNews && (

            <div className="main-news"   onClick={() => goToNews(mainNews._id)}>

              <img
                src={mainNews.thumbnail}
                alt={mlDisplay(mainNews.title, i18n.language)}
              />

              <div className="main-news-content">

                <span className="news-category">

                  {mainNews.tags?.[0] ||
                    t("news.defaultTag")}

                </span>

                <div className="news-date">

                  <CalendarDays size={16} />

                  {new Date(
                    mainNews.createdAt
                  ).toLocaleDateString()}

                </div>

                <h2>
                  {mlDisplay(mainNews.title, i18n.language)}
                </h2>

                <p>
                  {mlDisplay(mainNews.content, i18n.language)}
                </p>

                <button className="read-btn" onClick={() => goToNews(mainNews._id)}>

                  {t("news.read")}
                  {" "}
                  <ArrowRight size={18} />

                </button>

              </div>

            </div>

          )}

          {/* SIDE NEWS */}
          <div className="side-news">

            {filteredNews.map((item) => (

              <div
                className="side-news-card"
                key={item._id} onClick={() => goToNews(item._id)}
              >

                <img
                  src={item.thumbnail}
                  alt={mlDisplay(item.title, i18n.language)}
                />

                <div className="side-news-content">

                  <span>
                    {item.tags?.[0] ||
                      t("news.defaultTag")}
                  </span>

                  <div className="news-date small">

                    <CalendarDays size={14} />

                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}

                  </div>

                  <h3>
                    {mlDisplay(item.title, i18n.language)}
                  </h3>

                </div>

              </div>

            ))}

          </div>

        </div>

        {!loading &&
          news.length === 0 && (

            <p>
              {t("news.empty")}
            </p>

          )}

      </div>

{/* IMAGE MODAL */}


    </section>

  );
}