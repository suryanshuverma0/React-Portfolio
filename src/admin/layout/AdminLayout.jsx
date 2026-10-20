import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { getVisitorId } from "../../lib/visitorId";
import { registerOwnerDevice } from "../services/automation.service";

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

  // The notes workspace manages its own panes and scrolling edge to edge.
  const fullBleed = useLocation().pathname.startsWith("/dashboard/notes");

  return (
    <div className="h-screen bg-background flex overflow-hidden print:h-auto print:overflow-visible print:block">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header setSidebarOpen={setSidebarOpen} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

        <main
          className={
            fullBleed
              ? "flex-1 min-h-0 overflow-hidden"
              : " flex-1  overflow-y-auto px-6 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10 print:overflow-visible print:p-0"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
