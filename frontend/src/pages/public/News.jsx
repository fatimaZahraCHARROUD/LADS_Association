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
 
export default function News() {

const { t, i18n } = useTranslation();
   const [news, setNews] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

const [selectedNews, setSelectedNews] = useState(null);  useState(null);
  /* =====================
      FETCH NEWS
  ===================== */
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

  
  const priority = {
  urgent: 1,
  recruitment: 2,
  announcement: 3,
  general: 4,
};

const displayedNews = [...news]
  .filter((n) => {
    if (activeCategory === "all") return true;
    return (n.tags || []).includes(activeCategory);
  })
  .filter((n) => {
    const q = search.trim().toLowerCase();

    return (
      mlDisplay(n.title, i18n.language).toLowerCase().includes(q) ||
      mlDisplay(n.content, i18n.language).toLowerCase().includes(q) ||
      (n.tags || []).join(" ").toLowerCase().includes(q)
    );
  })
  .sort((a, b) => {
    const pa = priority[a.tags?.[0]] ?? 99;
    const pb = priority[b.tags?.[0]] ?? 99;

    if (pa !== pb) return pa - pb;

    // Same category → newest first
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

const mainNews = displayedNews[0] || null;
const filteredNews = displayedNews.slice(1);

 const categories = [
  "all",
  "urgent",
  "general",
  "announcement",
  "recruitment",
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

            <div className="main-news"      onClick={() => setSelectedNews(mainNews)}>

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
 
                

                <button className="read-btn"onClick={(e)=>{
        e.stopPropagation();
        setSelectedNews(mainNews);
    }}>

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
                key={item._id}     onClick={() => setSelectedNews(item)}

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
{
  selectedNews && (

    <div
      className="image-modal"
      onClick={() => setSelectedNews(null)}
    >

      <div
        className="image-modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-modal"
          onClick={() => setSelectedNews(null)}
        >
          ✕
        </button>

        <img
          src={selectedNews.thumbnail}
          alt={mlDisplay(
            selectedNews.title,
            i18n.language
          )}
        />

        <div className="preview-content">

          <span className="news-category">
            {selectedNews.tags?.[0] ||
              t("news.defaultTag")}
          </span>

          
          <h2>
            {mlDisplay(
              selectedNews.title,
              i18n.language
            )}
          </h2>

          <p>
            {mlDisplay(
              selectedNews.content,
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