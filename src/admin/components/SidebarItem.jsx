import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import { preloadAdminPage } from "../adminPages";

/*
  The active highlight is one shared element (layoutId) that glides from
  link to link instead of jumping. Hover/focus preloads the page's code so
  the click renders instantly even before background preloading finishes.
*/
function SidebarItem({ icon: Icon, label, path, collapsed = false, onNavigate }) {
  const preload = () => preloadAdminPage(path);

  return (
    <NavLink
      to={path}
      // Exact match where a sibling link lives underneath (Blog Analytics).
      end={path === "/dashboard" || path === "/dashboard/blog"}
      onClick={onNavigate}
      onMouseEnter={preload}
      onFocus={preload}
      onTouchStart={preload}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        `
        group relative
        flex items-center gap-3
        h-control px-4
        ${collapsed ? "lg:justify-center lg:px-0" : ""}
        rounded-control
        transition-colors duration-200
        ${isActive ? "text-primary font-medium" : "text-secondary hover:text-primary hover:bg-surface/60"}
      `
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="admin-sidebar-active"
              className="absolute inset-0 rounded-control bg-surface border border-border"
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
              aria-hidden
            />
          )}

          <Icon
            size={18}
            className="relative shrink-0 transition-transform duration-200 group-hover:scale-110"
          />

          <span className={`relative text-label truncate ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default SidebarItem;
