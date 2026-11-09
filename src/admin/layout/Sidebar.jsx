import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, X, Download, Search, ChevronDown, Star } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ThemeToggle from "../../components/ui/ThemeToggle";
import { isStandalone } from "../../lib/pwa";

import { useAuth } from "../../contexts/AuthContext";
import SidebarItem from "../components/SidebarItem";
import { sidebarLinks } from "../constants/sidebarLinks";

/* ========================================
   SIDEBAR
   Mobile: off-canvas drawer over the page.
   Desktop: full width, or collapsed to an
   icon rail (labels become tooltips) —
   toggled from the header, remembered.

   Pages are grouped (Overview, Portfolio,
   Content, Personal, System). Groups fold
   and remember it; the group holding the
   current page always opens. A filter box
   finds pages by name or purpose, and any
   page can be pinned (star) to the top.
========================================= */

const OPEN_KEY = "admin:sidebar-groups";
const PIN_KEY = "admin:sidebar-pins";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const ALL_ITEMS = sidebarLinks.flatMap((g) => g.items);

const isActivePath = (pathname, path) =>
  path === "/dashboard" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

function Sidebar({ sidebarOpen, setSidebarOpen, collapsed = false }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState(() => readJson(OPEN_KEY, {}));
  const [pins, setPins] = useState(() => readJson(PIN_KEY, []));
  const searchRef = useRef(null);

  // The group holding the current page is always open.
  const activeGroup = sidebarLinks.find((g) => g.items.some((i) => isActivePath(pathname, i.path)))?.id;

  const isOpen = (id) => (query ? true : id === activeGroup || openGroups[id] !== false);

  const toggleGroup = (id) =>
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !isOpen(id) };
      writeJson(OPEN_KEY, next);
      return next;
    });

  const togglePin = (path) =>
    setPins((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path].slice(-8);
      writeJson(PIN_KEY, next);
      return next;
    });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sidebarLinks;
    return sidebarLinks
      .map((g) => ({ ...g, items: g.items.filter((i) => `${i.label} ${i.keywords || ""} ${g.section}`.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
  }, [query]);

  const pinned = pins.map((p) => ALL_ITEMS.find((i) => i.path === p)).filter(Boolean);

  // "/" jumps to the filter box (when not typing somewhere else).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {/* Always mounted so it can fade in and out with the drawer */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto print:hidden
          h-screen overflow-y-auto overflow-x-hidden
          bg-card border-r border-border
          flex flex-col
          transition-[transform,width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          admin-scroll
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

        {/* Find a page */}
        <label className={`mb-4 flex items-center gap-2 rounded-control border border-border bg-surface px-3 focus-within:border-primary ${collapsed ? "lg:hidden" : ""}`}>
          <Search size={15} className="shrink-0 text-muted" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
              if (e.key === "Enter" && groups[0]?.items[0]) {
                navigate(groups[0].items[0].path);
                setQuery("");
                setSidebarOpen(false);
              }
            }}
            placeholder="Find a page..."
            className="h-10 min-w-0 flex-1 bg-transparent text-small outline-none"
            aria-label="Find a page"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-primary" aria-label="Clear">
              <X size={14} />
            </button>
          ) : (
            <kbd className="rounded border border-border px-1.5 text-[10px] text-muted">/</kbd>
          )}
        </label>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Admin">
          {!query && pinned.length > 0 && (
            <div className="mb-3 space-y-1">
              <p className={`flex items-center gap-1.5 px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted ${collapsed ? "lg:hidden" : ""}`}>
                <Star size={11} className="fill-current" /> Pinned
              </p>
              {pinned.map((item) => (
                <SidebarItem key={`pin-${item.path}`} {...item} collapsed={collapsed} pinned onTogglePin={() => togglePin(item.path)} onNavigate={() => setSidebarOpen(false)} />
              ))}
              {collapsed && <div className="hidden lg:block mx-2 my-2 h-px bg-border" aria-hidden />}
            </div>
          )}

          {groups.map((group) => {
            const open = isOpen(group.id);
            const GroupIcon = group.icon;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-muted transition hover:text-primary ${collapsed ? "lg:hidden" : ""}`}
                >
                  {GroupIcon && <GroupIcon size={13} />}
                  <span className="flex-1 text-left">{group.section}</span>
                  <span className="rounded-full bg-surface px-1.5 text-[10px] normal-case tracking-normal">{group.items.length}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
                </button>
                {collapsed && <div className="hidden lg:block mx-2 my-2 h-px bg-border" aria-hidden />}

                <AnimatePresence initial={false}>
                  {(open || collapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className={`space-y-1 overflow-hidden ${!open && collapsed ? "hidden lg:block" : ""}`}
                    >
                      {group.items.map((item) => (
                        <SidebarItem
                          key={item.path}
                          {...item}
                          collapsed={collapsed}
                          pinned={pins.includes(item.path)}
                          onTogglePin={() => togglePin(item.path)}
                          onNavigate={() => {
                            setSidebarOpen(false);
                            setQuery("");
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {!groups.length && <p className="px-2 py-4 text-center text-small text-muted">No page matches that search</p>}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6">
          {/* Phones: theme switch + install shortcut live here (header is compact) */}
          <div className="mb-3 flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            {!isStandalone() && (
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate("/dashboard/devices");
                }}
                className="flex h-control flex-1 items-center justify-center gap-2 rounded-control border border-border bg-surface text-small"
              >
                <Download size={16} /> Install app
              </button>
            )}
          </div>

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
