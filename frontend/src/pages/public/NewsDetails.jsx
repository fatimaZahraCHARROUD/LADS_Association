import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../../services/api";
import { mlDisplay } from "../../utils/i18n";

import "../../Styles/newsDetails.css";

export default function NewsDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [news, setNews] = useState(null);
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
  useEffect(() => {

    const fetchNews = async () => {
      try {
        const res = await api.get(`/news/${id}`);
        setNews(res?.data || res);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNews();

  }, [id]);

  if (!news) {
    return <div className="news-loading">Loading...</div>;
  }

  return (
    <div className="news-details-page">

      {/* BACK BUTTON */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back
      </button>

   

      {/* CONTENT */}
      <div className="news-content-layout">

  {/* LEFT IMAGE */}
  <div className="news-left">

    <img
      src={news.thumbnail}
      alt={mlDisplay(news.title)}
    />

  </div>

  {/* RIGHT CONTENT */}
  <div className="news-right">

    {/* TAG + DATE */}
    <div className="news-meta">

      <span className="news-tag">
        {news.tags?.[0] || "News"}
      </span>

      <span className="news-date">
        <CalendarDays size={16} />
        {new Date(news.createdAt).toLocaleDateString()}
      </span>

    </div>

    {/* TITLE */}
    <h1 className="news-title">
      {mlDisplay(news.title)}
    </h1>

    {/* CONTENT */}
    <div className="news-body">
      <p>
        {mlDisplay(news.content)}
      </p>
    </div>

  </div>

</div>

    </div>
  );
}