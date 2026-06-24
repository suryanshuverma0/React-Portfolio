import { NavLink } from "react-router-dom";

function SidebarItem({
  icon: Icon,
  label,
  path,
}) {
  return (
    <NavLink
      to={path}
      end={path === "/dashboard"}
      className={({ isActive }) =>
        `
        flex
        items-center
        gap-3

        h-control
        px-4

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
      <Icon size={18} />

      <span className="text-label">
        {label}
      </span>
    </NavLink>
  );
}

export default SidebarItem;