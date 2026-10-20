import { NavLink } from "react-router-dom";

function SidebarItem({ icon: Icon, label, path, collapsed = false, onNavigate }) {
  return (
    <NavLink
      to={path}
      // Exact match where a sibling link lives underneath (Blog Analytics).
      end={path === "/dashboard" || path === "/dashboard/blog"}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        `
        flex
        items-center
        gap-3

        h-control
        px-4
        ${collapsed ? "lg:justify-center lg:px-0" : ""}

        rounded-control

        transition-all

        ${
          isActive
            ? `
              bg-surface
              text-primary
              font-medium
            `
            : `
              text-secondary
              hover:bg-surface
              hover:text-primary
            `
        }
      `
      }
    >
      <Icon size={18} className="shrink-0" />

      <span className={`text-label truncate ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
    </NavLink>
  );
}

export default SidebarItem;
