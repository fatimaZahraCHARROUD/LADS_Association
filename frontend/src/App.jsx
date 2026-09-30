import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

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

// Admin Pages (existing)
import Dashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import AdminEventRegister from "./pages/admin/EventRegister";
import AdminNews from "./pages/admin/News";
import AdminActivities from "./pages/admin/Activities";
import AdminFormations from "./pages/admin/Formations";
import Contacts from "./pages/admin/Contacts";
import AdminMembership from "./pages/admin/Membership";
import AdminMembers from "./pages/admin/Members";
import Info from "./pages/admin/Info";
import AdminDocuments from "./pages/admin/Documents";
import AdminMeetings from "./pages/admin/Meetings";
import AdminDepartments from "./pages/admin/Departments";
import AdminProjects from "./pages/admin/Projects";
//exec
import ExecDashboard from "./pages/exec/Dashboard";
import ExecDocument from "./pages/exec/Document";
import ExecFollowup from "./pages/exec/Followup";
import ExecMeeting from "./pages/exec/Meeting";
import ExecMembers from "./pages/exec/Members";
import ExecStrategic from "./pages/exec/Strategic";

//team
import TeamDashboard from "./pages/team/Dashboard";
import TeamDocument from "./pages/team/Document";
import TeamFollowup from "./pages/team/Followup";
import TeamMeeting from "./pages/team/Meeting";
import TeamMembers from "./pages/team/Members";

//responsable
import RespDashboard from "./pages/responsible/Dashboard";
import RespDocument from "./pages/responsible/Document";
import RespMeeting from "./pages/responsible/Meeting";
import RespMembers from "./pages/responsible/Members";
import RespObjectives from "./pages/responsible/Objectives";
import Resptasks from "./pages/responsible/tasks";

//member
import MemberDashboard from "./pages/member/Dashboard";
import MemberDocument from "./pages/member/Document";
import MemberMeeting from "./pages/member/Meeting";
import Memberformation from "./pages/member/formation";
import Membertasks from "./pages/member/tasks";

// Layouts
import MainLayout from "./Layouts/MainLayout";
import AdminLayout from "./Layouts/AdminLayout";
import FormationsPage from "./pages/public/Formations";
import { useEffect } from "react";
import i18n from "./utils/tr";

function App() {
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
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
          error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetails />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/activities/:id" element={<ActivitiesDetails />} />
          <Route path="/formations" element={<FormationsPage />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ================= PRESIDENT ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allow={["President"]}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="formations" element={<AdminFormations />} />
          <Route path="eventRegister" element={<AdminEventRegister />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="membership" element={<AdminMembership />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="info" element={<Info />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="meetings" element={<AdminMeetings />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="projects" element={<AdminProjects />} />
        </Route>

        {/* ================= DIRECTOR EXECUTIVE ================= */}
<Route
  path="/exec"
  element={
    <ProtectedRoute>
      <RoleGuard allow={["Director Executive"]}>
        <AdminLayout />
      </RoleGuard>
    </ProtectedRoute>
  }
>
  <Route index element={<ExecDashboard />} />
  <Route path="strategic" element={<ExecStrategic />} />
  <Route path="members" element={<ExecMembers />} />
  <Route path="documents" element={<ExecDocument />} />
  <Route path="meetings" element={<ExecMeeting />} />
  <Route path="followup" element={<ExecFollowup />} />
</Route>

{/* ================= TEAM MANAGER ================= */}
<Route
  path="/team"
  element={
    <ProtectedRoute>
      <RoleGuard allow={["Team Manager"]}>
        <AdminLayout />
      </RoleGuard>
    </ProtectedRoute>
  }
>
  <Route index element={<TeamDashboard />} />
  <Route path="members" element={<TeamMembers />} />
  <Route path="documents" element={<TeamDocument />} />
  <Route path="meetings" element={<TeamMeeting />} />
  <Route path="followup" element={<TeamFollowup />} />
</Route>

{/* ================= RESPONSABLE ================= */}
<Route
  path="/responsible"
  element={
    <ProtectedRoute>
      <RoleGuard allow={["Responsable"]}>
        <AdminLayout />
      </RoleGuard>
    </ProtectedRoute>
  }
>
  <Route index element={<RespDashboard />} />
  <Route path="members" element={<RespMembers />} />
  <Route path="documents" element={<RespDocument />} />
  <Route path="meetings" element={<RespMeeting />} />
  <Route path="objectives" element={<RespObjectives />} />
  <Route path="tasks" element={<Resptasks />} />
</Route>

{/* ================= MEMBER ================= */}
<Route
  path="/member"
  element={
    <ProtectedRoute>
      <RoleGuard allow={["Member"]}>
        <AdminLayout />
      </RoleGuard>
    </ProtectedRoute>
  }
>
  <Route index element={<MemberDashboard />} />
  <Route path="documents" element={<MemberDocument />} />
  <Route path="meetings" element={<MemberMeeting />} />
  <Route path="formations" element={<Memberformation />} />
  <Route path="tasks" element={<Membertasks />} />
</Route>
      </Routes>
    </Router>
  );
}

export default App;