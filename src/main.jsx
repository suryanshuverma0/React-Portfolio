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
