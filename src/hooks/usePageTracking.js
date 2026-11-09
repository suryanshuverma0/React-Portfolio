import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initTracker, trackPageView } from "../lib/tracker";
import { gaPageView, initGA, optOutOfGA } from "../lib/ga";
import { useAuth } from "../contexts/AuthContext";

// Mount once at the app root: starts the journey tracker and Google
// Analytics, and records a page view on every route change.
function usePageTracking() {
  const { pathname } = useLocation();
  const { user, authLoading } = useAuth();
  const lastGaPath = useRef(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    initTracker();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // GA waits for auth to resolve so an admin's own visits are never sent.
  useEffect(() => {
    if (authLoading) return;

    if (isAdmin) {
      optOutOfGA();
      return;
    }

    if (lastGaPath.current === pathname) return;
    lastGaPath.current = pathname;

    initGA();
    gaPageView(pathname);
  }, [pathname, authLoading, isAdmin]);
}

export default usePageTracking;
