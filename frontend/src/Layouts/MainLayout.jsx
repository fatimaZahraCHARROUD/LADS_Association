import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  
  MessageCircle,
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import "../styles/mainLayout.css";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="main-layout">

      {/* TOP HEADER */}
      <div className="top-header">

        {/* LEFT */}
        <div className="top-left">

          <div className="top-item">
            <Phone size={16} />
            <span>+212 6 00 00 00 00</span>
          </div>

          <div className="top-item">
            <Mail size={16} />
            <span>contact@lads.org</span>
          </div>

        </div>

        {/* RIGHT */}
        <div className="top-right">

          <a href="#">
            <MessageCircle size={18} />
          </a>

          <a href="#">
            <FaInstagram size={18} />
          </a>

          <a href="#">
            <FaLinkedin size={18} />
          </a>

          {/* LANGUAGE SWITCHER */}
          <div className="lang-wrapper">

            <button
              className="lang-btn"
              onClick={() => setLangOpen(!langOpen)}
            >
              <Globe size={16} />
              EN
              <ChevronDown size={15} />
            </button>

            {langOpen && (
              <div className="lang-dropdown">
                <button>EN</button>
                <button>FR</button>
                <button>AR</button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MAIN NAVBAR */}
      <header className="navbar">

        {/* LOGO */}
        <Link to="/" className="logo-area">

          <img src="/logo.png" alt="Logo" width="60" />
          
          <div className="logo-text">
            <span className="logo-main">LADS</span>
            <span className="logo-sub">
               Association
            </span>
          </div>

        </Link>

        {/* MOBILE BUTTON */}
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* NAV LINKS */}
        <nav className={`nav-links ${open ? "active" : ""}`}>

          <Link onClick={() => setOpen(false)} to="/">
            Home
          </Link>

          <Link onClick={() => setOpen(false)} to="/about">
            About
          </Link>

          <Link onClick={() => setOpen(false)} to="/events">
            Events
          </Link>

          <Link onClick={() => setOpen(false)} to="/activities">
            Activities
          </Link>

           <Link onClick={() => setOpen(false)} to="/formations">
            Formations
          </Link>

          <Link onClick={() => setOpen(false)} to="/news">
            News
          </Link>

          

          <Link onClick={() => setOpen(false)} to="/contact">
            Contact
          </Link>

         

        </nav>

        {/* DESKTOP ACTION */}
        <div className="desktop-actions">

          {/* PRIMARY CTA */}
          <Link className="login-btn" to="/membership" style={{margin:"4px"}}>
            Join Us
          </Link>

          {/* SECONDARY CTA */}
          <Link className="join-btn" to="/login">
            Login
          </Link>

        </div>

      </header>

      {/* PAGE CONTENT */}
      <main className="content">
        <Outlet />
      </main>

      {/* FOOTER */}
     <footer className="footer">

  {/* TOP FOOTER */}
  <div className="footer-container">

    {/* COLUMN 1 - INFO */}
    <div className="footer-col">
      <h3>LADS Association</h3>
      <p>Empowering leaders through innovation, learning and community impact.</p>

      <div className="footer-contact">
        <p>📍 123 Street, Morocco</p>
        <p>📧 contact@lads.org</p>
        <p>📞 +212 6 00 00 00 00</p>
      </div>
    </div>

    {/* COLUMN 2 - NAVIGATION */}
    <div className="footer-col">
      <h4>Navigation</h4>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/events">Events</a>
      <a href="/activities">Activities</a>
      <a href="/news">News</a>
    </div>

    {/* COLUMN 3 - COMMUNITY */}
    <div className="footer-col">
      <h4>Community</h4>
      <a href="/membership">Membership</a>
      <a href="/contact">Contact</a>
      <a href="#">Partnerships</a>
      <a href="#">Careers</a>
    </div>

    {/* COLUMN 4 - SOCIAL + LANGUAGE */}
    <div className="footer-col">

      <h4>Follow Us</h4>

      <div className="footer-social">
        <a href="#">Instagram</a>
        <a href="#">LinkedIn</a>
        <a href="#">WhatsApp</a>
      </div>

      <div className="footer-lang">
        <select>
          <option>English</option>
          <option>Français</option>
          <option>العربية</option>
        </select>
      </div>

    </div>

  </div>

  {/* BOTTOM BAR */}
  <div className="footer-bottom">
    <p>© 2026 LADS Association. All rights reserved.</p>

    <div className="footer-links">
      <a href="#">Terms</a>
      <a href="#">Privacy</a>
      <a href="#">Cookies</a>
    </div>
  </div>

</footer>

    </div>
  );
}