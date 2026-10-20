import { LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import SidebarItem from "../components/SidebarItem";
import { sidebarLinks } from "../constants/sidebarLinks";

/* ========================================
   SIDEBAR
   Mobile: off-canvas drawer over the page.
   Desktop: full width, or collapsed to an
   icon rail (labels become tooltips) —
   toggled from the header, remembered.
========================================= */

function Sidebar({ sidebarOpen, setSidebarOpen, collapsed = false }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" aria-hidden />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto print:hidden
          h-screen overflow-y-auto overflow-x-hidden
          bg-card border-r border-border
          flex flex-col
          transition-[transform,width,padding] duration-300
          w-70 p-4
          ${collapsed ? "lg:w-20 lg:px-3" : ""}
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close */}
        <div className="flex justify-end mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="h-10 w-10 flex items-center justify-center rounded-control bg-surface border border-border"
          >
            <X size={18} />
          </button>
        </div>

        {/* Identity */}
        <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
          <div
            className="h-10 w-10 my-4 shrink-0 rounded-xl bg-primary text-background flex items-center justify-center text-sm font-semibold"
            title={collapsed ? "Suryanshu Verma" : undefined}
          >
            SV
          </div>

          <div className={collapsed ? "lg:hidden" : ""}>
            <p className="text-label">Suryanshu Verma</p>
            <p className="text-small">Computer Engineer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-6">
          {sidebarLinks.map((section) => (
            <div key={section.section} className="space-y-2">
              <p className={`text-muted px-2 uppercase tracking-wider ${collapsed ? "lg:hidden" : ""}`}>{section.section}</p>
              {collapsed && <div className="hidden lg:block mx-2 h-px bg-border" aria-hidden />}

              {section.items.map((item) => (
                <SidebarItem key={item.path} {...item} collapsed={collapsed} onNavigate={() => setSidebarOpen(false)} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <div className={`card mb-4 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-small truncate">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full h-control flex items-center justify-center gap-2 rounded-control bg-surface border border-border hover:opacity-80 transition"
          >
            <LogOut size={18} />
            <span className={collapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
