import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public Pages
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Events from "./pages/public/Events";
import News from "./pages/public/News";
import Activities from "./pages/public/Activities";
import Contact from "./pages/public/Contact";
import Membership from "./pages/public/Membership";
import Login from "./pages/public/Login";
import EventDetails from "./pages/public/EventDetails";
import NewsDetails from "./pages/public/NewsDetails";
import ActivitiesDetails from "./pages/public/ActivitiesDetails";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import AdminEventRegister from "./pages/admin/EventRegister";
import AdminNews from "./pages/admin/News";
import AdminActivities from "./pages/admin/Activities";
import Contacts from "./pages/admin/Contacts";
import AdminMembership from "./pages/admin/Membership";
import Info from "./pages/admin/Info";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Events */}
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />

          {/* News */}
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetails />} />

          {/* Activities */}
          <Route path="/activities" element={<Activities />} />
          <Route path="/activities/:id" element={<ActivitiesDetails />} />


          {/* Membership */}
          <Route path="/membership" element={<Membership />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />
        </Route>


        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />

          {/* Manage Events */}
          <Route path="events" element={<AdminEvents />} />

          {/* Manage News */}
          <Route path="news" element={<AdminNews />} />

          {/* Manage Activities */}
          <Route path="activities" element={<AdminActivities />} />

          {/* Manage Event Register */}
          <Route path="eventRegister" element={<AdminEventRegister />} />

          {/* Manage Contacts */}
          <Route path="contacts" element={<Contacts />} />

          {/* Membership */}
          <Route path="membership" element={<AdminMembership />} />
          
          {/* Info */}
          <Route path="info" element={<Info />} />
        
        </Route>
     
      </Routes>
    </Router>
  );
}

export default App;