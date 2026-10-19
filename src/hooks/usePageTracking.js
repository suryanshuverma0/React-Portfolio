import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initTracker, trackPageView } from "../lib/tracker";

// Mount once at the app root: starts the journey tracker and records a
// page view on every route change.
function usePageTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    initTracker();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}

export default usePageTracking;
