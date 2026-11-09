import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { preloadAdminPage } from "../adminPages";

/*
  The active highlight is one shared element (layoutId) that glides from
  link to link instead of jumping. Hover/focus preloads the page's code so
  the click renders instantly. The star pins a page to the top of the
  sidebar (visible on hover, always when pinned).
*/
function SidebarItem({ icon: Icon, label, path, collapsed = false, onNavigate, pinned = false, onTogglePin }) {
  const preload = () => preloadAdminPage(path);

  return (
    <div className="group/item relative">
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
          h-10 px-3 pr-9
          ${collapsed ? "lg:justify-center lg:px-0 lg:pr-0" : ""}
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

            <Icon size={18} className="relative shrink-0 transition-transform duration-200 group-hover:scale-110" />

            <span className={`relative text-label truncate ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
          </>
        )}
      </NavLink>

      {onTogglePin && (
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
          title={pinned ? "Unpin" : "Pin to top"}
          className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 transition ${
            collapsed ? "lg:hidden" : ""
          } ${pinned ? "text-[var(--color-chart-4)] opacity-100" : "text-muted opacity-0 hover:text-primary group-hover/item:opacity-100 focus:opacity-100"}`}
        >
          <Star size={13} className={pinned ? "fill-current" : ""} />
        </button>
      )}
    </div>
  );
}

export default SidebarItem;
