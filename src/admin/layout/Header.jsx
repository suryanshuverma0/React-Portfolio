import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { getAdminTitle } from "../constants/sidebarLinks";

import ThemeToggle from "../../components/ui/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "../components/NotificationBell";

function Header({ setSidebarOpen, collapsed, onToggleCollapsed, onOpenSearch }) {
  const location = useLocation();

  const { user } = useAuth();

  const title = getAdminTitle(location.pathname);

  const getInitials = () => {
    if (!user?.email) return "A";

    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header
      className="
        sticky
        print:hidden
        top-0
        z-30

        h-16

        bg-background/80

        backdrop-blur-xl

        border-b
        border-border

        px-4
        md:px-6
        lg:px-8

        flex
        items-center
        justify-between
      "
    >
      {/* LEFT */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="
            lg:hidden

            h-10
            w-10

            flex
            items-center
            justify-center

            rounded-control

            bg-surface

            border
            border-border

            transition
          "
        >
          <Menu size={18} />
        </button>

        {/* Desktop: collapse / expand the sidebar */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex h-10 w-10 items-center justify-center rounded-control bg-surface border border-border hover:opacity-80 transition"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="relative min-w-0 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h1
              key={title}
              className="text-title truncate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.h1>
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search (Ctrl+K)"
          title="Search (Ctrl+K)"
          className="h-10 inline-flex items-center gap-2 rounded-control bg-surface border border-border px-3 text-small text-muted hover:opacity-80 transition"
        >
          <Search size={16} />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline rounded border border-border px-1.5 text-[11px]">Ctrl K</kbd>
        </button>

        <NotificationBell />

        <ThemeToggle />

        <div
          className="
            h-10
            w-10

            rounded-full

            bg-surface

            border
            border-border

            flex
            items-center
            justify-center

            text-label
          "
        >
          {getInitials()}
        </div>
      </div>
    </header>
  );
}

export default Header;