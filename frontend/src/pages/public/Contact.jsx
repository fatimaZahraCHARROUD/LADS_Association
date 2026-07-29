import React, { useEffect, useState } from "react";

import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
} from "lucide-react";

import {
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";

import { useTranslation } from "react-i18next";

import { api } from "../../services/api";
import "../../Styles/contact.css";

const API_URL = "http://localhost:3000/contact-messages";

export default function Contact() {

  const { t } = useTranslation();

  const [ladsInfo, setLadsInfo] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /* ================= LOAD INFO ================= */
  useEffect(() => {

    const load = async () => {
      try {

        const data = await api.get("/lads-info");

        setLadsInfo(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);
      }
    };

    load();

  }, []);

  /* ================= MAP INFO ================= */
  const infoMap = Object.fromEntries(
    ladsInfo.map((i) => [
      i.title?.en?.toLowerCase(),
      i.content?.en,
    ])
  );

  const phone =
    infoMap.phone || "+212 6 00 00 00 00";

  const email =
    infoMap.email || "contact@lads.org";

  const address =
    infoMap.address || "Berkane, Morocco";

  const instagram =
    infoMap.instagram || "#";

  const linkedin =
    infoMap.linkedin || "#";

  const whatsappNumber =
    phone.replace(/\D/g, "");

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 2000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2000);
  };

  const validateForm = () => {

    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
    } = formData;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !subject ||
      !message
    ) {
      showError(t("contact.errors.required"));
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showError(t("contact.errors.email"));
      return false;
    }

    const phoneRegex =
      /^(?:\+|00|0)?[1-9]\d{7,14}$/;

    if (!phoneRegex.test(phone)) {
      showError(t("contact.errors.phone"));
      return false;
    }

    if (message.length < 10) {
      showError(t("contact.errors.message"));
      return false;
    }

    return true;
  };
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {

      const payload = {
        fullName:
          `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message);

      showSuccess(
        t("contact.success")
      );

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

    } catch (err) {

      showError(
        err.message ||
          t("contact.errors.generic")
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <section className="contact-page">

      {/* HERO */}
      <div className="contact-hero">

        <div className="container hero-content">

          <span className="hero-badge">
            {t("contact.hero.badge")}
          </span>

          <h1>
            {t("contact.hero.title")}
          </h1>

          <p>
            {t("contact.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        <div className="contact-card">

          {/* INFO */}
          <div className="contact-info">

            <h2>
              {t("contact.info.title")}
            </h2>

            <p>
              {t("contact.info.desc")}
            </p>

            <div className="info-item">
              <Mail size={20} />
              <span>{email}</span>
            </div>

            <div className="info-item">
              <Phone size={20} />
              <span>{phone}</span>
            </div>

            <div className="info-item">
              <MapPin size={20} />
              <span>{address}</span>
            </div>

            {/* SOCIAL */}
            <div className="social-icons">

              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram />
              </a>

              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <FaLinkedinIn />
              </a>

              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp />
              </a>

            </div>

          </div>

          {/* FORM */}
          <div className="contact-form">

            <h2>
              {t("contact.form.title")}
            </h2>

            <form onSubmit={handleSubmit}>

              <div className="form-row">

                <input
                  name="firstName"
                  placeholder={t("contact.form.first")}
                  value={formData.firstName}
                  onChange={handleChange}
                />

                <input
                  name="lastName"
                  placeholder={t("contact.form.last")}
                  value={formData.lastName}
                  onChange={handleChange}
                />

              </div>

              <input
                name="email"
                placeholder={t("contact.form.email")}
                value={formData.email}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder={t("contact.form.phone")}
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                name="subject"
                placeholder={t("contact.form.subject")}
                value={formData.subject}
                onChange={handleChange}
              />

              <textarea
                name="message"
                rows="6"
                placeholder={t("contact.form.message")}
                value={formData.message}
                onChange={handleChange}
              />

              {success && (
                <p className="success-message">
                  {success}
                </p>
              )}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? t("contact.sending")
                  : t("contact.send")}

                <Send size={18} />

              </button>

            </form>

          </div>

        </div>

      </div>

    </section>

  );
}