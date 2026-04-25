import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "../styles/mainLayout.css";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  return (
    <div className="main-layout">

    <header className="navbar">

        <div className="logo">LADS</div>

        <button className="menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
        </button>

        <nav className={`nav-links ${open ? "active" : ""}`}>
            <Link onClick={() => setOpen(false)} to="/">Home</Link>
            <Link onClick={() => setOpen(false)} to="/about">About</Link>
            <Link onClick={() => setOpen(false)} to="/events">Events</Link>
            <Link onClick={() => setOpen(false)} to="/activities">Activities</Link>
            <Link onClick={() => setOpen(false)} to="/news">News</Link>
            <Link onClick={() => setOpen(false)} to="/membership">Membership</Link>
            <Link onClick={() => setOpen(false)} to="/contact">Contact</Link>

            <Link className="login-mobile" to="/login">Login</Link>
        </nav>

        <div className="right-actions">

  {/* LANGUAGE DRAWER */}
  <div className="lang-wrapper">
    <button
      className="lang-btn"
      onClick={() => setLangOpen(!langOpen)}
    >
      🌐 EN ▾
    </button>

    {langOpen && (
      <div className="lang-drawer">
        <button>EN</button>
        <button>FR</button>
        <button>AR</button>
      </div>
    )}
  </div>

  {/* LOGIN */}
  <Link className="login-btn" to="/login">
    Login
  </Link>

</div>

    </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        © 2026 LADS Association - All rights reserved
      </footer>

    </div>
  );
}