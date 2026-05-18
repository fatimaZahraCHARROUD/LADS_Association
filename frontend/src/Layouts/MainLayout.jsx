import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { api } from "../services/api";

import {
  Menu,
  X,
  Phone,
  Mail,Globe, ChevronDown
} from "lucide-react";

import {
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa";

import { useTranslation } from "react-i18next";

import "../styles/mainLayout.css";

export default function MainLayout() {

  const [open, setOpen] = useState(false);

  const [ladsInfo, setLadsInfo] = useState([]);

  const { t, i18n } = useTranslation();

  /* =========================
      LOAD INFO
  ========================= */
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

  /* =========================
      RTL / LTR
  ========================= */
  useEffect(() => {

    document.documentElement.dir =
      i18n.language === "ar" ? "rtl" : "ltr";

    document.documentElement.lang = i18n.language;

  }, [i18n.language]);

  /* =========================
      INFO MAP
  ========================= */
  const infoMap = Object.fromEntries(
    ladsInfo.map((i) => [
      i.title?.en?.toLowerCase(),
      i.content?.en,
    ])
  );

  const phone =
    infoMap.phone || "+212 656-731018";

  const email =
    infoMap.email || "lahdse@gmail.com";

  const instagram =
    infoMap.instagram || "#";

  const linkedin =
    infoMap.linkedin || "#";

  return (
    <div className="main-layout">

      {/* TOP HEADER */}
      <div className="top-header">

        {/* LEFT */}
        <div className="top-left">

          <div className="top-item">
            <Phone size={16} />
            <span>{phone}</span>
          </div>

          <div className="top-item">
            <Mail size={16} />
            <span>{email}</span>
          </div>

        </div>

        {/* RIGHT */}
        <div className="top-right">

          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
          >
            <FaInstagram size={18} />
          </a>

          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedin size={18} />
          </a>

          <a
            href={
              phone
                ? `https://wa.me/${phone.replace(/\D/g, "")}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp size={18} />
          </a>

          {/* LANG SWITCHER */}
          <div className="lang-switcher">

            <button
              onClick={() => i18n.changeLanguage("en")}
              className={
                i18n.language === "en"
                  ? "active-lang"
                  : ""
              }
            >
              EN
            </button>

            <button
              onClick={() => i18n.changeLanguage("fr")}
              className={
                i18n.language === "fr"
                  ? "active-lang"
                  : ""
              }
            >
              FR
            </button>

            <button
              onClick={() => i18n.changeLanguage("ar")}
              className={
                i18n.language === "ar"
                  ? "active-lang"
                  : ""
              }
            >
              AR
            </button>

          </div>

        </div>

      </div>

      {/* NAVBAR */}
      <header className="navbar">

        {/* LOGO */}
        <Link
          to="/"
          className="logo-area"
        >

          <img
            src="/logo.png"
            alt="Logo"
            width="60"
          />

         

        </Link>

        {/* MOBILE BUTTON */}
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
        >
          {
            open
              ? <X size={28} />
              : <Menu size={28} />
          }
        </button>

        {/* NAV LINKS */}
        <nav
          className={`nav-links ${open ? "active" : ""}`}
        >

          <Link
            onClick={() => setOpen(false)}
            to="/"
          >
            {t("layout.nav.home")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/about"
          >
            {t("layout.nav.about")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/events"
          >
            {t("layout.nav.events")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/activities"
          >
            {t("layout.nav.activities")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/formations"
          >
            {t("layout.nav.formations")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/news"
          >
            {t("layout.nav.news")}
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/contact"
          >
            {t("layout.nav.contact")}
          </Link>

        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="desktop-actions">

          <Link
            className="login-btn"
            to="/membership"
            style={{ margin: "4px" }}
          >
            {t("layout.join")}
          </Link>

          <Link
            className="join-btn"
            to="/login"
          >
            {t("layout.login")}
          </Link>

        </div>

      </header>

      {/* CONTENT */}
      <main className="content">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer">

        <div className="footer-container">

          {/* COL 1 */}
          <div className="footer-col">

            <h3>
              LADS Association
            </h3>

            <p>
              {t("layout.footer.desc")}
            </p>

            <div className="footer-contact">

              <p>
                📍 {t("layout.footer.location")}
              </p>

              <p>
                📧 {email}
              </p>

              <p>
                📞 {phone}
              </p>

            </div>

          </div>

          {/* COL 2 */}
          <div className="footer-col">

            <h4>
              {t("layout.footer.navigation")}
            </h4>

            <a href="/">
              {t("layout.nav.home")}
            </a>

            <a href="/about">
              {t("layout.nav.about")}
            </a>

            <a href="/events">
              {t("layout.nav.events")}
            </a>

            <a href="/activities">
              {t("layout.nav.activities")}
            </a>

            <a href="/news">
              {t("layout.nav.news")}
            </a>

          </div>

          {/* COL 3 */}
          <div className="footer-col">

            <h4>
              {t("layout.footer.community")}
            </h4>

            <a href="/membership">
              {t("layout.footer.membership")}
            </a>

            <a href="/contact">
              {t("layout.nav.contact")}
            </a>

            <a href="#">
              {t("layout.footer.partnerships")}
            </a>

            <a href="#">
              {t("layout.footer.careers")}
            </a>

          </div>

          {/* COL 4 */}
          <div className="footer-col">

            <h4>
              {t("layout.footer.follow")}
            </h4>

            <div className="footer-social">

              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>

              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>

              <a
                href={
                  phone
                    ? `https://wa.me/${phone.replace(/\D/g, "")}`
                    : "#"
                }
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>

            </div>

            {/* LANG SELECT */}
            <div className="footer-lang">

              <select
                value={i18n.language}
                onChange={(e) =>
                  i18n.changeLanguage(e.target.value)
                }
              >

                <option value="en">
                  English
                </option>

                <option value="fr">
                  Français
                </option>

                <option value="ar">
                  العربية
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* BOTTOM */}
        <div className="footer-bottom">

          <p>
            © 2026 LADS Association.
            {" "}
            {t("layout.footer.rights")}
          </p>

          <div className="footer-links">

            <a href="#">
              {t("layout.footer.terms")}
            </a>

            <a href="#">
              {t("layout.footer.privacy")}
            </a>

            <a href="#">
              {t("layout.footer.cookies")}
            </a>

          </div>

        </div>

      </footer>

    </div>
  );
}