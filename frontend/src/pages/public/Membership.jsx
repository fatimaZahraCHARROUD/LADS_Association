import React, { useState } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import "../../Styles/membership.css";

const API_URL = "http://localhost:3000/membership-requests";

export default function Membership() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <GraduationCap size={28} />,
      title: t("membership.benefits.training.title"),
      text: t("membership.benefits.training.text"),
    },
    {
      icon: <Users size={28} />,
      title: t("membership.benefits.networking.title"),
      text: t("membership.benefits.networking.text"),
    },
    {
      icon: <Briefcase size={28} />,
      title: t("membership.benefits.projects.title"),
      text: t("membership.benefits.projects.text"),
    },
    {
      icon: <HeartHandshake size={28} />,
      title: t("membership.benefits.impact.title"),
      text: t("membership.benefits.impact.text"),
    },
  ];

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    motivation: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.city ||
      !form.motivation
    ) {
      setError(t("membership.errors.required"));
      setTimeout(() => setError(""), 2000);
      return false;
    }

    const phoneRegex = /^(?:\+|00|0)?[1-9]\d{7,14}$/;

    if (!phoneRegex.test(form.phone)) {
      setError(t("membership.errors.phone"));
      setTimeout(() => setError(""), 2000);
      return false;
    }

    if (form.motivation.trim().length < 10) {
      setError(t("membership.errors.motivation"));
      setTimeout(() => setError(""), 2000);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMsg(t("membership.success"));

      setForm({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        motivation: "",
      });

      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="membership-page">

      {/* HERO */}
      <div className="membership-hero">
        <div className="container hero-content">

          <span className="hero-badge">
            {t("membership.hero.badge")}
          </span>

          <h1>
            {t("membership.hero.title")}
          </h1>

          <p>
            {t("membership.hero.desc")}
          </p>

        </div>
      </div>

      <div className="container">

        {/* WHY */}
        <section className="why-section">

          <div className="why-content">

            <span className="section-tag">
              {t("membership.why.tag")}
            </span>

            <h2>
              {t("membership.why.title")}
            </h2>

            <p>
              {t("membership.why.desc")}
            </p>

            <div className="why-list">

              <div>
                <CheckCircle2 size={20} />
                {t("membership.why.points.p1")}
              </div>

              <div>
                <CheckCircle2 size={20} />
                {t("membership.why.points.p2")}
              </div>

              <div>
                <CheckCircle2 size={20} />
                {t("membership.why.points.p3")}
              </div>

              <div>
                <CheckCircle2 size={20} />
                {t("membership.why.points.p4")}
              </div>

            </div>

          </div>

          <div className="why-image">
            <img
              src="images/home.png"
              alt="membership"
            />
          </div>

        </section>

        {/* BENEFITS */}
        <section className="benefits-section">

          <div className="section-header">

            <span className="section-tag">
              {t("membership.benefits.tag")}
            </span>

            <h2>
              {t("membership.benefits.title")}
            </h2>

          </div>

          <div className="benefits-grid">

            {benefits.map((b, i) => (
              <div className="benefit-card" key={i}>
                <div className="benefit-icon">
                  {b.icon}
                </div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}

          </div>

        </section>

        {/* FORM */}
        <section className="membership-form-section">

          <div className="form-card">

            <div className="section-header">

              <span className="section-tag">
                {t("membership.form.tag")}
              </span>

              <h2>
                {t("membership.form.title")}
              </h2>

            </div>

            <form
              className="membership-form"
              onSubmit={handleSubmit}
            >

              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t("membership.form.fullName")}
              />

              <div className="form-row">

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("membership.form.email")}
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("membership.form.phone")}
                />

              </div>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder={t("membership.form.city")}
              />

              <textarea
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
                rows="6"
                placeholder={t("membership.form.motivation")}
              />

              {msg && (
                <p className="success-message">{msg}</p>
              )}

              {error && (
                <p className="error-message">{error}</p>
              )}

              <button type="submit" disabled={loading}>

                {loading ? (
                  <>
                    {t("membership.form.sending")}
                    <Loader2 size={18} className="spin" />
                  </>
                ) : (
                  <>
                    {t("membership.form.submit")}
                    <Send size={18} />
                  </>
                )}

              </button>

            </form>

          </div>

        </section>

      </div>
    </section>
  );
}