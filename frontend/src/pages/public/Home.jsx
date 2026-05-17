import React from "react";
import {
  Users,
  CalendarDays,
  Newspaper,
  Lightbulb,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../Styles/home.css";

export default function Home() {
  const { t } = useTranslation();
const navigate = useNavigate();
  return (
    <div className="home-page">

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="container hero-wrapper">
          <div className="hero-content">

            <h1>
              {t("home.hero.title")}
            </h1>

            <p>
              {t("home.hero.desc")}
            </p>

            <br />
            <br />
            <br />

            {/* <div className="hero-buttons">

              <button className="primary-btn">
                {t("home.cta.button")}
                <ArrowRight size={18} />
              </button>

              <button className="secondary-btn">
                {t("home.activities.activities.button")}
              </button>

            </div> */}

          </div>
        </div>

        {/* STATS */}
        <div className="hero-stats-wrapper">
          <div className="container">
            <div className="hero-stats-bar">

              <div className="stat-item">
                <h2>30+</h2>
                <p>{t("home.stats.members")}</p>
              </div>

              <div className="stat-item">
                <h2>15+</h2>
                <p>{t("home.stats.events")}</p>
              </div>

              <div className="stat-item">
                <h2>10+</h2>
                <p>{t("home.stats.formations")}</p>
              </div>

              <div className="stat-item">
                <h2>10+</h2>
                <p>{t("home.stats.activites")}</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <div className="container">

        {/* ABOUT */}
        <section className="about-section">

          <div className="about-image">
            <div className="image-box"></div>
          </div>

          <div className="about-content">

            <span className="section-tag">
              {t("home.about.tag")}
            </span>

            <h2>
              {t("home.about.title")}
            </h2>

            <p>
              {t("home.about.desc")}
            </p>

            <div className="about-features">

              <div>
                <Sparkles />
                <span>
                  {t("home.about.features.innovation")}
                </span>
              </div>

              <div>
                <GraduationCap />
                <span>
                  {t("home.about.features.training")}
                </span>
              </div>

              <div>
                <Globe />
                <span>
                  {t("home.about.features.community")}
                </span>
              </div>

              <div>
                <Briefcase />
                <span>
                  {t("home.about.features.entrepreneurship")}
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* VALUES */}
        <section className="values-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.values.tag")}
            </span>

            <h2>
              {t("home.values.title")}
            </h2>

            <p>
              {t("home.values.desc")}
            </p>

          </div>

          <div className="values-grid">

            <div className="value-card">
              <Lightbulb />

              <h3>
                {t("home.values.innovation.title")}
              </h3>

              <p>
                {t("home.values.innovation.desc")}
              </p>
            </div>

            <div className="value-card">
              <Users />

              <h3>
                {t("home.values.leadership.title")}
              </h3>

              <p>
                {t("home.values.leadership.desc")}
              </p>
            </div>

            <div className="value-card">
              <Target />

              <h3>
                {t("home.values.impact.title")}
              </h3>

              <p>
                {t("home.values.impact.desc")}
              </p>
            </div>

            <div className="value-card">
              <TrendingUp />

              <h3>
                {t("home.values.growth.title")}
              </h3>

              <p>
                {t("home.values.growth.desc")}
              </p>
            </div>

          </div>

        </section>

        {/* MAIN ACTIVITIES */}
        <section className="programs-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.activities.tag")}
            </span>

            <h2>
              {t("home.activities.title")}
            </h2>

            <p>
              {t("home.activities.desc")}
            </p>

          </div>

          <div className="programs-grid">

            {/* EVENTS */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <CalendarDays size={22} />
                </div>

                <h3>
                  {t("home.activities.events.title")}
                </h3>

                <p>
                  {t("home.activities.events.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/events")}>
                  {t("home.activities.events.button")}
                </button>

              </div>

            </div>

            {/* ACTIVITIES */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('images/home_act.png')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <Users size={22} />
                </div>

                <h3>
                  {t("home.activities.activities.title")}
                </h3>

                <p>
                  {t("home.activities.activities.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/activities")}>
                  {t("home.activities.activities.button")}
                </button>

              </div>

            </div>

            {/* NEWS */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('images/news.jpeg')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <Newspaper size={22} />
                </div>

                <h3>
                  {t("home.activities.news.title")}
                </h3>

                <p>
                  {t("home.activities.news.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/news")}>
                  {t("home.activities.news.button")}
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* FORMATIONS */}
        <section className="formations-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.formations.tag")}
            </span>

            <h2>
              {t("home.formations.title")}
            </h2>

            <p>
              {t("home.formations.desc")}
            </p>

          </div>

          <div className="formations-slider">

            {/* LEFT */}
            <div
              className="formation-card side-card"
              style={{
                backgroundImage:
                  "url('images/for_left.jpeg')",
              }}
            >
              <div className="formation-layer">
                <h3>
                  {t("home.formations.entrepreneurship")}
                </h3>
              </div>
            </div>

            {/* CENTER */}
            <div
              className="formation-card main-card"
              style={{
                backgroundImage:
                  "url('images/leader.jpeg')",
              }}
            >
              <div className="formation-layer">

                <h3>
                  {t("home.formations.leadership.title")}
                </h3>

                <p>
                  {t("home.formations.leadership.desc")}
                </p>

                <button className="primary-btn"   onClick={() => navigate("/formations")}>
                  {t("home.formations.button")}
                </button>

              </div>
            </div>

            {/* RIGHT */}
            <div
              className="formation-card side-card"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop')",
              }}
            >
              <div className="formation-layer">
                <h3>
                  {t("home.formations.innovation")}
                </h3>
              </div>
            </div>

          </div>

        </section>

        {/* TESTIMONIALS */}
        <section className="testimonials">

          <div className="section-header">

            <span className="section-tag">
              {t("home.testimonials.tag")}
            </span>

            <h2>
              {t("home.testimonials.title")}
            </h2>

          </div>

          <div className="testimonial-grid">

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.first.text")}”
              </p>

              <h4>
                — {t("home.testimonials.first.author")}
              </h4>

            </div>

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.second.text")}”
              </p>

              <h4>
                — {t("home.testimonials.second.author")}
              </h4>

            </div>

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.third.text")}”
              </p>

              <h4>
                — {t("home.testimonials.third.author")}
              </h4>

            </div>

          </div>

        </section>

        {/* CTA */}
        <section className="cta-section">

          <div className="cta-box">

            <h2>
              {t("home.cta.title")}
            </h2>

            <p>
              {t("home.cta.desc")}
            </p>

            <button className="primary-btn" onClick={()=>navigate("/membership")}>
              {t("home.cta.button")}
              <ArrowRight size={18} />
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}