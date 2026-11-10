import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { getVisitorId } from "../../lib/visitorId";
import { registerOwnerDevice } from "../services/automation.service";
import CommandPalette from "../components/CommandPalette";
import PageLoader from "../components/ui/PageLoader";
import { preloadAllAdminPages } from "../adminPages";
import { getAdminTitle } from "../constants/sidebarLinks";

const COLLAPSED_KEY = "admin:sidebar-collapsed";

const loadCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl/⌘+K opens the command palette from anywhere in the admin.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !value;
    });

  // This browser belongs to the admin: its portfolio visits never trigger
  // "long visit" alerts.
  useEffect(() => {
    registerOwnerDevice(getVisitorId()).catch(() => {});
  }, []);

  // Download every admin page in the background, so later clicks never
  // wait on the network.
  useEffect(() => {
    preloadAllAdminPages();
  }, []);

  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // The content scrolls inside <main>, so the window-level scroll reset
  // never reached it: start each page at the top.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    document.title = `${getAdminTitle(pathname)} · Admin — Suryanshu Verma`;
  }, [pathname]);

  // The notes workspace manages its own panes and scrolling edge to edge.
  // So does a whiteboard (/dashboard/boards/<id>).
  const fullBleed = pathname.startsWith("/dashboard/notes") || /^\/dashboard\/boards\/[^/]+/.test(pathname);

  return (
    <div className="h-screen bg-background flex overflow-hidden print:h-auto print:overflow-visible print:block">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          setSidebarOpen={setSidebarOpen}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onOpenSearch={() => setPaletteOpen(true)}
        />

        <main
          ref={mainRef}
          className={
            fullBleed
              ? "flex-1 min-h-0 overflow-hidden"
              : "admin-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8 xl:px-10 xl:py-10 print:overflow-visible print:p-0"
          }
        >
          {/*
            Suspense lives here, not around the whole app: while a page's
            code loads only this area shows the loader — the sidebar and
            header never disappear. Navigations run as transitions, so an
            already-shown page stays on screen until the next one is ready.
          */}
          <Suspense fallback={<PageLoader />}>
            <motion.div
              key={pathname}
              className={fullBleed ? "h-full" : undefined}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

export default AdminLayout;
