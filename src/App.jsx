import { useEffect, useState } from "react";

import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";

import ProjectDetails from "./pages/ProjectDetails";

import InitialLoader from "./components/common/InitialLoader";

import NotFound from "./pages/NotFound";

import { AnimatePresence } from "framer-motion";

import { useLocation } from "react-router-dom";

import PageTransition from "./components/common/PageTransition";

import VerifyPage from "./pages/VerifyPage";
function App() {
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <InitialLoader loading={loading} />

      {!loading && (
        <div
          className="
            min-h-screen

            bg-background

            text-primary
          "
        >
          <AnimatePresence mode="wait">
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
            </Routes>
          </AnimatePresence>
        
        </div>
      )}
    </>
  );
}

export default App;
