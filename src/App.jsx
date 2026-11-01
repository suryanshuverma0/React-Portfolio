import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

import InitialLoader from "./components/common/InitialLoader";

import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import PageTransition from "./components/common/PageTransition";

import ScrollToHash from "./components/common/ScrollToHash";

import { useAuth } from "./contexts/AuthContext";
// import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/routes/ProtectedRoute";

import MaintenanceScreen from "./components/common/MaintenanceScreen";
import { getPublicSettings } from "./services/public.settings.service";
import usePageTracking from "./hooks/usePageTracking";

/*
  Everything except the homepage is split into its own chunk: visitors
  never download the admin dashboard, the auth screens or the ethers-based
  verify page unless they open them.
*/
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserAccess = lazy(() => import("./pages/UserAccess"));
const LinkPasskey = lazy(() => import("./pages/LinkPasskey"));
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Profile = lazy(() => import("./admin/pages/Profile"));
const Education = lazy(() => import("./admin/pages/Education"));
const Stats = lazy(() => import("./admin/pages/Stats"));
const Experience = lazy(() => import("./admin/pages/Experience"));
const Services = lazy(() => import("./admin/pages/Services"));
const Projects = lazy(() => import("./admin/pages/Projects"));
const Certificates = lazy(() => import("./admin/pages/Certificates"));
const Skills = lazy(() => import("./admin/pages/Skills"));
const Analytics = lazy(() => import("./admin/pages/Analytics"));
const Settings = lazy(() => import("./admin/pages/Settings"));
const Users = lazy(() => import("./admin/pages/Users"));
const AdminBlog = lazy(() => import("./admin/pages/Blog"));
const BlogEditor = lazy(() => import("./admin/pages/BlogEditor"));
const BlogComments = lazy(() => import("./admin/pages/BlogComments"));
const Messages = lazy(() => import("./admin/pages/Messages"));
const Security = lazy(() => import("./admin/pages/Security"));
const Visitors = lazy(() => import("./admin/pages/Visitors"));
const VisitorSession = lazy(() => import("./admin/pages/VisitorSession"));
const Storage = lazy(() => import("./admin/pages/Storage"));
const CardPage = lazy(() => import("./pages/Card"));
const CardAdmin = lazy(() => import("./admin/pages/CardAdmin"));
const Notes = lazy(() => import("./admin/pages/Notes"));
const Automations = lazy(() => import("./admin/pages/Automations"));
const BlogAnalytics = lazy(() => import("./admin/pages/BlogAnalytics"));
const ExecutiveReport = lazy(() => import("./admin/pages/ExecutiveReport"));

/*
  Gates the public-facing portfolio pages only — login/register/dashboard
  etc. stay reachable so the admin can always get in and flip
  maintenanceMode back off, even while it's on.
*/
function PublicGate({ maintenanceMode, children }) {
  if (maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return children;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const location = useLocation();

  const { authLoading } = useAuth();

  usePageTracking();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadMaintenanceStatus = async () => {
      try {
        const settings = await getPublicSettings();

        setMaintenanceMode(Boolean(settings?.maintenanceMode));
      } catch (error) {
        console.error("Failed to load site settings", error);
      }
    };

    loadMaintenanceStatus();
  }, []);

  return (
    <>
      <InitialLoader loading={loading} />

      {!loading && !authLoading && (
        <div
          className="
            min-h-screen

            text-primary
          "
        >
          <Suspense fallback={null}>
          <AnimatePresence mode="wait">
            <ScrollToHash />
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PublicGate maintenanceMode={maintenanceMode}>
                    <PageTransition>
                      <HomePage />
                    </PageTransition>
                  </PublicGate>
                }
              />
              <Route
                path="/projects/:slug"
                element={
                  <PublicGate maintenanceMode={maintenanceMode}>
                    <PageTransition>
                      <ProjectDetails />
                    </PageTransition>
                  </PublicGate>
                }
              />
              <Route
                path="/blog"
                element={
                  <PublicGate maintenanceMode={maintenanceMode}>
                    <PageTransition>
                      <Blog />
                    </PageTransition>
                  </PublicGate>
                }
              />
              <Route
                path="/blog/:slug"
                element={
                  <PublicGate maintenanceMode={maintenanceMode}>
                    <PageTransition>
                      <BlogPost />
                    </PageTransition>
                  </PublicGate>
                }
              />
              {/* NFC business card — deliberately outside PublicGate so a
                  tap still works while the portfolio is in maintenance. */}
              <Route path="/card" element={<CardPage />} />
              <Route
                path="*"
                element={
                  <PageTransition>
                    <NotFound />
                  </PageTransition>
                }
              />
              <Route
                path="/verify"
                element={
                  <PageTransition>
                    <VerifyPage />
                  </PageTransition>
                }
              />
              <Route
                path="/login"
                element={
                  <PageTransition>
                    <Login />
                  </PageTransition>
                }
              />
              <Route
                path="/register"
                element={
                  <PageTransition>
                    <Register />
                  </PageTransition>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PageTransition>
                    <ForgotPassword />
                  </PageTransition>
                }
              />

              <Route
                path="/reset-password/:token"
                element={
                  <PageTransition>
                    <ResetPassword />
                  </PageTransition>
                }
              />

              <Route
                path="/account"
                element={
                  <PageTransition>
                    <UserAccess />
                  </PageTransition>
                }
              />

              <Route
                path="/link-passkey/:token"
                element={
                  <PageTransition>
                    <LinkPasskey />
                  </PageTransition>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="education" element={<Education />} />
                <Route path="stats" element={<Stats />} />
                <Route path="experience" element={<Experience />} />
                <Route path="services" element={<Services />} />
                <Route path="projects" element={<Projects />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="skill" element={<Skills />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="visitors" element={<Visitors />} />
                <Route path="visitors/:sessionId" element={<VisitorSession />} />
                <Route path="users" element={<Users />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="blog/new" element={<BlogEditor />} />
                <Route path="blog/:id/edit" element={<BlogEditor />} />
                <Route path="blog/comments" element={<BlogComments />} />
                <Route path="messages" element={<Messages />} />
                <Route path="security" element={<Security />} />
                <Route path="storage" element={<Storage />} />
                <Route path="card" element={<CardAdmin />} />
                <Route path="notes" element={<Notes />} />
                <Route path="automations" element={<Automations />} />
                <Route path="blog/analytics" element={<BlogAnalytics />} />
                <Route path="report" element={<ExecutiveReport />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </AnimatePresence>
          </Suspense>
        </div>
      )}
    </>
  );
}

export default App;
