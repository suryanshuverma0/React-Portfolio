import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProjectDetails from "./pages/ProjectDetails";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import InitialLoader from "./components/common/InitialLoader";
import NotFound from "./pages/NotFound";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import PageTransition from "./components/common/PageTransition";
import VerifyPage from "./pages/VerifyPage";
import ScrollToHash from "./components/common/ScrollToHash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserAccess from "./pages/UserAccess";
import LinkPasskey from "./pages/LinkPasskey";
import { useAuth } from "./contexts/AuthContext";
// import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/routes/ProtectedRoute";

import AdminLayout from "./admin/layout/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Profile from "./admin/pages/Profile";
import Education from "./admin/pages/Education"
import Stats from "./admin/pages/Stats"
import Experience from "./admin/pages/Experience"
import Services from "./admin/pages/Services"
import Projects from "./admin/pages/Projects";
import Certificates from "./admin/pages/Certificates";
import Skills from "./admin/pages/Skills";
import Analytics from "./admin/pages/Analytics";
import Settings from "./admin/pages/Settings";
import Users from "./admin/pages/Users";
import AdminBlog from "./admin/pages/Blog";
import BlogEditor from "./admin/pages/BlogEditor";
import BlogComments from "./admin/pages/BlogComments";
import Messages from "./admin/pages/Messages";
import Security from "./admin/pages/Security";
function App() {
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const { authLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <InitialLoader loading={loading} />

      {!loading && !authLoading && (
        <div
          className="
            min-h-screen

            bg-background

            text-primary
          "
        >
          <AnimatePresence mode="wait">
            <ScrollToHash />
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <HomePage />
                  </PageTransition>
                }
              />
              <Route
                path="/projects/:slug"
                element={
                  <PageTransition>
                    <ProjectDetails />
                  </PageTransition>
                }
              />
              <Route
                path="/blog"
                element={
                  <PageTransition>
                    <Blog />
                  </PageTransition>
                }
              />
              <Route
                path="/blog/:slug"
                element={
                  <PageTransition>
                    <BlogPost />
                  </PageTransition>
                }
              />
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
                <Route path="users" element={<Users />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="blog/new" element={<BlogEditor />} />
                <Route path="blog/:id/edit" element={<BlogEditor />} />
                <Route path="blog/comments" element={<BlogComments />} />
                <Route path="messages" element={<Messages />} />
                <Route path="security" element={<Security />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default App;
