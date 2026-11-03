import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CornerDownLeft,
  FolderKanban,
  Newspaper,
  NotebookPen,
  Mail,
  Award,
  Briefcase,
  Footprints,
  Plus,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { sidebarLinks } from "../constants/sidebarLinks";
import { searchAdmin } from "../services/system.service";

/* ========================================
   COMMAND PALETTE — Ctrl/⌘+K anywhere in
   the admin. Jumps to pages, runs quick
   actions, and searches content (projects,
   posts, notes, messages, visitors…).
========================================= */

const TYPE_META = {
  project: { label: "Project", icon: FolderKanban },
  post: { label: "Blog post", icon: Newspaper },
  note: { label: "Note", icon: NotebookPen },
  message: { label: "Message", icon: Mail },
  certificate: { label: "Certificate", icon: Award },
  experience: { label: "Experience", icon: Briefcase },
  visitor: { label: "Visitor", icon: Footprints },
};

const ACTIONS = [
  { title: "New blog post", path: "/dashboard/blog/new", icon: Plus },
  { title: "New goal", path: "/dashboard/goals", icon: Plus },
  { title: "Live visitors", path: "/dashboard/visitors", icon: Footprints },
];

const PAGES = sidebarLinks.flatMap((section) =>
  section.items.map((item) => ({ title: item.label, path: item.path, icon: item.icon, section: section.section })),
);

const matches = (text, query) => text.toLowerCase().includes(query.toLowerCase());

function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ query: "", items: [] });
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced server search; results are tagged with the query they answer.
  useEffect(() => {
    const text = query.trim();

    if (text.length < 2) return undefined;

    let cancelled = false;

    const timer = setTimeout(() => {
      setSearching(true);
      searchAdmin(text)
        .then((data) => !cancelled && setResults({ query: text, items: data.results }))
        .catch(() => !cancelled && setResults({ query: text, items: [] }))
        .finally(() => !cancelled && setSearching(false));
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const items = useMemo(() => {
    const text = query.trim();
    const pages = (text ? PAGES.filter((p) => matches(p.title, text)) : PAGES).map((p) => ({ ...p, group: "Pages", key: `page:${p.path}` }));
    const actions = (text ? ACTIONS.filter((a) => matches(a.title, text)) : ACTIONS).map((a) => ({ ...a, group: "Actions", key: `action:${a.title}` }));
    const content = (results.query === text ? results.items : []).map((r) => ({
      ...r,
      icon: TYPE_META[r.type]?.icon || Search,
      group: "Content",
      typeLabel: TYPE_META[r.type]?.label || r.type,
      key: `${r.type}:${r.id}`,
    }));

    return text ? [...content, ...pages, ...actions] : [...actions, ...pages];
  }, [query, results]);

  const current = Math.min(active, Math.max(0, items.length - 1));
  // A search cancelled by clearing the box never reports back.
  const isSearching = searching && query.trim().length >= 2;

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const go = (item) => {
    if (!item) return;
    onClose();
    navigate(item.path);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current + 1) % Math.max(1, items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(items[current]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[var(--color-card)] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          {isSearching ? <Loader2 size={18} className="text-muted animate-spin" /> : <Search size={18} className="text-muted" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, posts, notes, messages, visitors…"
            className="h-14 flex-1 bg-transparent text-body outline-none"
            aria-controls="command-palette-list"
          />
          <kbd className="hidden sm:inline rounded border border-border px-1.5 py-0.5 text-[11px] text-muted">Esc</kbd>
        </div>

        <ul id="command-palette-list" ref={listRef} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {!items.length && (
            <li className="px-3 py-8 text-center text-small text-muted">{isSearching ? "Searching…" : `No results for “${query}”`}</li>
          )}

          {items.map((item, index) => {
            const Icon = item.icon || ArrowRight;
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;

            return (
              <li key={item.key} role="presentation">
                {header && <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider text-muted">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === current}
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 rounded-control px-3 py-2.5 text-left transition ${index === current ? "bg-surface" : ""}`}
                >
                  <Icon size={16} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-small truncate">{item.title}</span>
                    {(item.subtitle || item.typeLabel) && (
                      <span className="block text-xs text-muted truncate">
                        {[item.typeLabel, item.subtitle].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  {index === current && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[11px] text-muted">
          <span>↑↓ to move · Enter to open</span>
          <span>Ctrl / ⌘ + K</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
