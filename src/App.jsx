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
import { setAppearanceScope } from "./lib/appearance";
import {
  AdminLayout,
  Dashboard,
  Profile,
  Education,
  Stats,
  Experience,
  Services,
  Projects,
  Certificates,
  Skills,
  Analytics,
  Settings,
  Users,
  AdminBlog,
  BlogEditor,
  BlogComments,
  Messages,
  Security,
  Visitors,
  VisitorSession,
  Storage,
  CardAdmin,
  Notes,
  Automations,
  BlogAnalytics,
  ExecutiveReport,
  Goals,
  AuditLog,
  SystemHealth,
  Appearance,
} from "./admin/adminPages";

/*
  Everything except the homepage is split into its own chunk: visitors
  never download the admin dashboard, the auth screens or the ethers-based
  verify page unless they open them.
*/
const loadProjectDetails = () => import("./pages/ProjectDetails");
const loadBlog = () => import("./pages/Blog");
const loadBlogPost = () => import("./pages/BlogPost");

const ProjectDetails = lazy(loadProjectDetails);
const Blog = lazy(loadBlog);
const BlogPost = lazy(loadBlogPost);
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserAccess = lazy(() => import("./pages/UserAccess"));
const LinkPasskey = lazy(() => import("./pages/LinkPasskey"));
const CardPage = lazy(() => import("./pages/Card"));

/*
  Every route under /dashboard shares one key, so navigating inside the
  admin keeps AdminLayout (sidebar, header, bell) mounted and only swaps
  the page in its <Outlet />. Keying by full pathname remounted the whole
  shell on every click — the "page refresh" blink. Public pages keep the
  per-path key so their enter/exit transition still plays.
*/
const routeKey = (pathname) =>
  pathname === "/dashboard" || pathname.startsWith("/dashboard/") ? "/dashboard" : pathname;

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

  // Custom appearance styles the public site; the admin keeps the built-in look.
  useEffect(() => {
    setAppearanceScope(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Warm the public page chunks once the homepage has settled, so opening
  // a project or the blog never waits on a download (no blank frame).
  useEffect(() => {
    const warm = () => {
      [loadBlog, loadBlogPost, loadProjectDetails].forEach((load) => load().catch(() => {}));
    };

    const id =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(warm, { timeout: 5000 })
        : setTimeout(warm, 3000);

    return () =>
      "cancelIdleCallback" in window ? window.cancelIdleCallback(id) : clearTimeout(id);
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
            <Routes location={location} key={routeKey(location.pathname)}>
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
                <Route path="goals" element={<Goals />} />
                <Route path="audit" element={<AuditLog />} />
                <Route path="system" element={<SystemHealth />} />
                <Route path="settings" element={<Settings />} />
                <Route path="appearance" element={<Appearance />} />
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
