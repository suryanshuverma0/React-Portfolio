import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import "./styles/globals.css";

import App from "./App.jsx";

import { AuthProvider } from "./contexts/AuthContext";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
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
  </StrictMode>,
);
