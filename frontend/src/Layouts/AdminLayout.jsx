import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Calendar,
  Activity,
  Newspaper,
  Mail,
  Users,
  Settings,
  LogOut,
  Menu
} from "lucide-react";

import "../styles/adminLayout.css";

export default function AdminLayout() {
  const [cmsOpen, setCmsOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

        {/* TOP */}
        <div className="sidebar-top">
          {!collapsed && <h2 className="logo">ADMIN</h2>}

          <button
            className="icon-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu />
          </button>
        </div>

        {/* DASHBOARD */}
        <Link to="/admin" className="sidebar-item">
          <LayoutDashboard />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* CMS */}
        <button
            className="sidebar-itemD"
            onClick={() => {
                if (collapsed) {
                setCollapsed(false); // auto open sidebar
                }
                setCmsOpen(!cmsOpen);
            }}
            >
            <Database />

            {!collapsed && <span>CMS</span>}

            {!collapsed && (
                <span className={`arrow ${cmsOpen ? "open" : ""}`}>▸</span>
            )}
        </button>

        {cmsOpen && !collapsed && (
          <div className="drawer">
            <Link to="/admin/events"><Calendar size={16}/> Events</Link>
            <Link to="/admin/activities"><Activity size={16}/> Activities</Link>
            <Link to="/admin/news"><Newspaper size={16}/> News</Link>
            <Link to="/admin/info"><Settings size={16}/> Settings</Link>
          </div>
        )}

        {/* MSG */}
        <button
            className="sidebar-itemD"
            onClick={() => {
                if (collapsed) {
                setCollapsed(false);
                }
                setMsgOpen(!msgOpen);
            }}
            >
            <MessageSquare />

            {!collapsed && <span>MSG</span>}

            {!collapsed && (
                <span className={`arrow ${msgOpen ? "open" : ""}`}>▸</span>
            )}
        </button>

        {msgOpen && !collapsed && (
          <div className="drawer">
            <Link to="/admin/contacts"><Mail size={16}/> Contacts</Link>
            <Link to="/admin/membership"><Users size={16}/> Membership</Link>
          </div>
        )}

        {/* LOGOUT */}
        <Link to="/" className="sidebar-item danger">
          <LogOut />
          {!collapsed && <span>Logout</span>}
        </Link>

      </aside>

      {/* CONTENT */}
      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}