import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import "./styles/globals.css";

import App from "./App.jsx";

import { AuthProvider } from "./contexts/AuthContext";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { MotionConfig } from "framer-motion";

import api from "./lib/axios";

import { initAppearance } from "./lib/appearance";

import { initAppMode } from "./lib/pwa";

// Capture the "install app" prompt early (admin app mode).
initAppMode();

// Paint the site's customized look (cached) before React renders, then
// refresh it from the server.
initAppearance(api);


/*
  index.html ships static head tags for crawlers that don't run JS. Once
  the app boots, <SEO /> owns those tags per route — drop the static copies
  so rendered pages never carry two descriptions or canonicals. The
  homepage-only structured data (profile, FAQ) also goes on other routes.
*/
document.querySelectorAll("[data-static-seo]").forEach((node) => node.remove());

if (window.location.pathname !== "/") {
  document.querySelectorAll("[data-home-only]").forEach((node) => node.remove());
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            {/* Honour the OS "reduce motion" setting for every Framer animation */}
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={true}
              newestOnTop={true}
              closeOnClick
              pauseOnHover
              draggable
              theme="dark"
            />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
