import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";

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
import AdminFormations from "./pages/admin/Formations";
import Contacts from "./pages/admin/Contacts";
import AdminMembership from "./pages/admin/Membership";
import Info from "./pages/admin/Info";

// Layouts
import MainLayout from "./Layouts/MainLayout";
import AdminLayout from "./Layouts/AdminLayout";
import FormationsPage from "./pages/public/Formations";
import { useEffect } from "react";
import i18n from "./utils/tr";

function App() {

   useEffect(() => {
    document.documentElement.dir =
      i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1F2937",
            color: "#fff",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.9rem",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
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

          {/* Formation */}
          <Route path="/formations" element={<FormationsPage />} />


          {/* Membership */}
          <Route path="/membership" element={<Membership />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />
        </Route>


        {/* ================= ADMIN ROUTES ================= */}
          <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
            >
            <Route index element={<Dashboard />} />

          {/* Manage Events */}
          <Route path="events" element={<AdminEvents />} />

          {/* Manage News */}
          <Route path="news" element={<AdminNews />} />

          {/* Manage Activities */}
          <Route path="activities" element={<AdminActivities />} />

          {/* Manage Formations */}
          <Route path="formations" element={<AdminFormations />} />

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