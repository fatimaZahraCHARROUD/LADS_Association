import { useState, useEffect } from 'react';
import {
  Users, Calendar, Activity, Newspaper,
  Mail, UserPlus, ClipboardList, TrendingUp,
} from 'lucide-react';
import '../../styles/dashboard.css';

const API = 'http://localhost:3000';

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

const STAT_CARDS = [
  { key: 'events',        label: 'Events',               icon: Calendar,     color: '#1E3A8A' },
  { key: 'activities',    label: 'Activities',            icon: Activity,     color: '#10B981' },
  { key: 'news',          label: 'News Articles',         icon: Newspaper,    color: '#F59E0B' },
  { key: 'users',         label: 'Members',               icon: Users,        color: '#6366F1' },
  { key: 'contacts',      label: 'Contact Messages',      icon: Mail,         color: '#EF4444' },
  { key: 'memberships',   label: 'Membership Requests',   icon: UserPlus,     color: '#0EA5E9' },
  { key: 'registrations', label: 'Event Registrations',   icon: ClipboardList,color: '#8B5CF6' },
];

export default function Dashboard() {
  const [stats, setStats]               = useState({ events: 0, activities: 0, news: 0, users: 0, contacts: 0, memberships: 0, registrations: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    const headers = authHeader();

    Promise.all([
      fetch(`${API}/users`,               { headers }).then(r => r.json()),
      fetch(`${API}/events`).then(r => r.json()),
      fetch(`${API}/activities`).then(r => r.json()),
      fetch(`${API}/news`).then(r => r.json()),
      fetch(`${API}/contact-messages`,    { headers }).then(r => r.json()),
      fetch(`${API}/membership-requests`, { headers }).then(r => r.json()),
      fetch(`${API}/event-registrations`, { headers }).then(r => r.json()),
    ])
      .then(([users, events, activities, news, contacts, memberships, registrations]) => {
        setStats({
          users:         Array.isArray(users)         ? users.length         : 0,
          events:        Array.isArray(events)        ? events.length        : 0,
          activities:    Array.isArray(activities)    ? activities.length    : 0,
          news:          Array.isArray(news)          ? news.length          : 0,
          contacts:      Array.isArray(contacts)      ? contacts.length      : 0,
          memberships:   Array.isArray(memberships)   ? memberships.length   : 0,
          registrations: Array.isArray(registrations) ? registrations.length : 0,
        });
        setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);
        setRecentRequests(Array.isArray(memberships) ? memberships.slice(0, 5) : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard data.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="dash-loading"><TrendingUp size={28} /> Loading...</div>;
  if (error)   return <div className="dash-error">{error}</div>;

  return (
    <div className="dashboard">

      <header className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here's what's happening.</p>
        </div>
      </header>

      {/* STATS GRID */}
      <section className="stats-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div className="stat-card" key={key}>
            <div className="stat-icon" style={{ background: color + '1A', color }}>
              <Icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-count">{stats[key]}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* RECENT TABLES */}
      <section className="tables-grid">

        {/* RECENT EVENTS */}
        <div className="data-card">
          <div className="data-card-header">
            <h2><Calendar size={16} /> Recent Events</h2>
          </div>
          {recentEvents.length === 0
            ? <p className="empty">No events yet.</p>
            : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map(ev => (
                    <tr key={ev._id}>
                      <td>{ev.title?.en || ev.title?.fr || '—'}</td>
                      <td>{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`badge badge-${ev.status}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ev.isPublished ? 'badge-published' : 'badge-draft'}`}>
                          {ev.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {/* RECENT MEMBERSHIP REQUESTS */}
        <div className="data-card">
          <div className="data-card-header">
            <h2><UserPlus size={16} /> Recent Membership Requests</h2>
          </div>
          {recentRequests.length === 0
            ? <p className="empty">No requests yet.</p>
            : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map(req => (
                    <tr key={req._id}>
                      <td>{req.fullName}</td>
                      <td>{req.email}</td>
                      <td>{req.city || '—'}</td>
                      <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

      </section>
    </div>
  );
}
