import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Bookmark as BookmarkIcon, Search, LayoutGrid, List, Pin, PinOff, Pencil, Trash2, Copy, Plus, X, Loader2, Wand2,
  FileText, Link2, Upload, Download, BookOpen, Check, Folder, Hash, Inbox, Star,
} from "lucide-react";

import api from "../../lib/axios";
import LifeGate from "../life/LifeGate";
import { parseBookmarkHtml, parseBookmarkJson, toBookmarkHtml, toBookmarkCsv, downloadText, hostOf, looksLikeUrl } from "../bookmarks/bookmarkIO";

/* ========================================
   BOOKMARKS — save links (details fetched
   for you) and text snippets with category,
   tags, notes, pin and a reading list.
   Paste a link anywhere on the page to save
   it. Import/export browser bookmark files.
========================================= */

const data = (r) => r.data.data;
const fail = (e, msg = "Something went wrong") => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || msg);
const EMPTY = { kind: "link", url: "", title: "", description: "", content: "", category: "", tags: [], icon: "", image: "", siteName: "", color: "", notes: "", pinned: false, status: "saved" };
const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-small outline-none focus:border-primary";
const remember = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

/* ---------- editor ---------- */

function TagInput({ value, onChange, suggestions }) {
  const [text, setText] = useState("");
  const add = (raw) => {
    const t = raw.trim().replace(/^#/, "").toLowerCase().slice(0, 40);
    if (t && !value.includes(t)) onChange([...value, t].slice(0, 30));
    setText("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-1.5 focus-within:border-primary">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs">
          #{t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        list="bookmark-tags"
        value={text}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          }
          if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
        placeholder={value.length ? "" : "Add tags — Enter or comma"}
        className="h-7 min-w-[8rem] flex-1 bg-transparent text-small outline-none"
        style={{ outline: "none" }}
      />
      <datalist id="bookmark-tags">
        {suggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

function Editor({ initial, facets, onClose, onSaved }) {
  const [b, setB] = useState({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const set = (patch) => setB((x) => ({ ...x, ...patch }));

  const fetchMeta = async (url = b.url) => {
    let link = url.trim();
    if (!link) return;
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
    setFetching(true);
    try {
      const meta = data(await api.post("/bookmarks/preview", { url: link }));
      setB((x) => ({ ...x, url: meta.url || link, title: x.title || meta.title, description: x.description || meta.description, icon: meta.icon || x.icon, image: meta.image || x.image, siteName: meta.siteName || x.siteName, color: x.color || meta.color }));
    } catch (e) {
      set({ url: link });
      fail(e, "Couldn't read that page — fill in the details yourself");
    } finally {
      setFetching(false);
    }
  };

  // Auto-fetch when opened from a pasted link.
  const auto = useRef(Boolean(initial.autoFetch));
  useEffect(() => {
    if (auto.current) {
      auto.current = false;
      fetchMeta(initial.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    let url = b.url.trim();
    if (b.kind === "link" && url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    const title = b.title.trim() || hostOf(url) || b.content.trim().split("\n")[0].slice(0, 80);
    if (!title) return toast.error("Give it a title");
    if (b.kind === "link" && !url) return toast.error("Add the link");
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, b[k] ?? EMPTY[k]]));
    Object.assign(body, { url: b.kind === "link" ? url : url || "", title, category: b.category.trim() });
    setBusy(true);
    try {
      const saved = b._id ? data(await api.patch(`/bookmarks/${b._id}`, body)) : data(await api.post("/bookmarks", body));
      onSaved(saved, !b._id);
    } catch (err) {
      const first = err.response?.data?.errors?.[0];
      toast.error(first ? `${first.field}: ${first.message}` : err.response?.data?.message || "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onSubmit={save} className="max-h-[92dvh] w-full max-w-xl space-y-3.5 overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1 sm:max-w-xs">
            {[
              ["link", "Link", Link2],
              ["text", "Text / snippet", FileText],
            ].map(([v, l, Icon]) => (
              <button key={v} type="button" onClick={() => set({ kind: v })} className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs ${b.kind === v ? "bg-background font-medium shadow-sm" : "text-muted"}`}>
                <Icon size={13} /> {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {b.kind === "link" && (
          <div className="flex gap-2">
            <input className={field} value={b.url} onChange={(e) => set({ url: e.target.value })} onBlur={() => !b.title && b.url && fetchMeta()} placeholder="https://…" autoFocus={!b.url} />
            <button type="button" onClick={() => fetchMeta()} disabled={fetching || !b.url} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs disabled:opacity-40" title="Fetch title, description and image">
              {fetching ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Fetch
            </button>
          </div>
        )}
        {b.kind === "link" && (b.image || b.icon) && (
          <div className="flex items-center gap-3 rounded-xl border border-border p-2">
            {b.image ? <img src={b.image} alt="" className="h-14 w-24 rounded-lg object-cover" /> : null}
            {b.icon && <img src={b.icon} alt="" className="h-6 w-6 rounded" />}
            <span className="min-w-0 flex-1 truncate text-xs text-muted">{b.siteName || hostOf(b.url)}</span>
            <button type="button" onClick={() => set({ image: "" })} className="text-xs text-muted hover:text-primary">
              Remove image
            </button>
          </div>
        )}

        <input className={field} value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" autoFocus={Boolean(b.url) || b.kind === "text"} />
        {b.kind === "text" && <textarea rows={6} className={`${field} resize-y font-mono text-[13px]`} value={b.content} onChange={(e) => set({ content: e.target.value })} placeholder="Paste or type anything — a command, a quote, an address, a snippet…" />}
        <textarea rows={2} className={`${field} resize-y`} value={b.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" />

        <div className="grid gap-2 sm:grid-cols-2">
          <input list="bookmark-categories" className={field} value={b.category} onChange={(e) => set({ category: e.target.value })} placeholder="Category (e.g. Learning, Tools)" />
          <datalist id="bookmark-categories">
            {facets.categories.filter((c) => c.value).map((c) => (
              <option key={c.value} value={c.value} />
            ))}
          </datalist>
          <select className={field} value={b.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="saved">Saved</option>
            <option value="unread">Reading list — to read</option>
            <option value="read">Read</option>
          </select>
        </div>
        <TagInput value={b.tags} onChange={(tags) => set({ tags })} suggestions={facets.tags.map((t) => t.value)} />
        <textarea rows={2} className={`${field} resize-y`} value={b.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Private notes — why you saved it" />
        <label className="flex items-center gap-2 text-small">
          <input type="checkbox" checked={b.pinned} onChange={(e) => set({ pinned: e.target.checked })} /> Pin to the top
        </label>
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy && <Loader2 size={15} className="animate-spin" />} {b._id ? "Save changes" : "Save bookmark"}
        </button>
      </motion.form>
    </div>
  );
}

/* ---------- cards ---------- */

function Actions({ b, onPatch, onEdit, onDelete }) {
  const btn = "rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary";
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" className={btn} onClick={() => onPatch(b, { pinned: !b.pinned })} title={b.pinned ? "Unpin" : "Pin"}>
        {b.pinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
      {b.status !== "saved" && (
        <button type="button" className={btn} onClick={() => onPatch(b, { status: b.status === "read" ? "unread" : "read" })} title={b.status === "read" ? "Mark unread" : "Mark read"}>
          {b.status === "read" ? <BookOpen size={14} /> : <Check size={14} />}
        </button>
      )}
      <button type="button" className={btn} onClick={() => navigator.clipboard.writeText(b.kind === "text" ? b.content || b.title : b.url).then(() => toast.success("Copied"))} title="Copy">
        <Copy size={14} />
      </button>
      <button type="button" className={btn} onClick={() => onEdit(b)} title="Edit">
        <Pencil size={14} />
      </button>
      <button type="button" className={`${btn} hover:text-red-500`} onClick={() => onDelete(b)} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Card({ b, view, onOpen, ...actions }) {
  const host = hostOf(b.url);
  const thumb = b.image ? (
    <img src={b.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" onError={(e) => (e.currentTarget.style.display = "none")} />
  ) : (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${b.color || "var(--color-surface)"}33, var(--color-surface))` }}>
      {b.kind === "text" ? <FileText size={26} className="text-muted" /> : b.icon ? <img src={b.icon} alt="" className="h-10 w-10 rounded-xl" /> : <Link2 size={24} className="text-muted" />}
    </div>
  );

  if (view === "list") {
    return (
      <motion.div layout className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 pr-2">
        <button type="button" onClick={() => onOpen(b)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-border">{thumb}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-small font-medium">
              {b.pinned && <Pin size={12} className="shrink-0 text-[var(--color-chart-2)]" />}
              {b.status === "unread" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-chart-1)]" title="To read" />}
              <span className="truncate">{b.title}</span>
            </span>
            <span className="block truncate text-xs text-muted">
              {b.kind === "text" ? (b.content || b.description).slice(0, 120) : host}
              {b.category && ` · ${b.category}`}
            </span>
          </span>
        </button>
        <div className="opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <Actions b={b} {...actions} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.5)]">
      <button type="button" onClick={() => onOpen(b)} className="relative block aspect-[16/9] overflow-hidden border-b border-border text-left">
        {thumb}
        <span className="absolute left-2 top-2 flex gap-1">
          {b.pinned && (
            <span className="rounded-full bg-background/85 p-1 backdrop-blur">
              <Pin size={11} />
            </span>
          )}
          {b.status === "unread" && <span className="rounded-full bg-[var(--color-chart-1)] px-2 py-0.5 text-[10px] font-medium text-white">To read</span>}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <button type="button" onClick={() => onOpen(b)} className="text-left">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{b.title}</h3>
        </button>
        {(b.kind === "text" ? b.content : b.description) && <p className={`line-clamp-3 text-xs text-muted ${b.kind === "text" ? "whitespace-pre-wrap font-mono" : ""}`}>{b.kind === "text" ? b.content : b.description}</p>}
        {b.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {b.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-secondary">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-2">
          {b.icon && b.kind === "link" && <img src={b.icon} alt="" className="h-3.5 w-3.5 rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} />}
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted">{b.kind === "text" ? "Snippet" : host}{b.category && ` · ${b.category}`}</span>
          <div className="opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            <Actions b={b} {...actions} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- page ---------- */

function BookmarksBody() {
  const [items, setItems] = useState(null);
  const [facets, setFacets] = useState({ total: 0, categories: [], tags: [], kinds: [], statuses: [] });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ type: "all", value: "" });
  const [view, setView] = useState(() => remember("bookmarks:view", "grid"));
  const [sort, setSort] = useState("recent");
  const [editing, setEditing] = useState(null);
  const [quick, setQuick] = useState("");
  const [importing, setImporting] = useState(false);
  const searchRef = useRef(null);
  const fileRef = useRef(null);

  const params = useMemo(() => {
    const p = { sort };
    if (q.trim()) p.q = q.trim();
    if (filter.type === "category") p.category = filter.value || "__none";
    if (filter.type === "tag") p.tag = filter.value;
    if (filter.type === "pinned") p.pinned = "1";
    if (filter.type === "unread") p.status = "unread";
    if (filter.type === "text") p.kind = "text";
    return p;
  }, [q, filter, sort]);

  const load = useCallback(() => {
    api.get("/bookmarks", { params }).then((r) => setItems(data(r))).catch((e) => fail(e, "Couldn't load bookmarks"));
    api.get("/bookmarks/facets").then((r) => setFacets(data(r))).catch(() => {});
  }, [params]);

  useEffect(() => {
    const id = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  // "/" focuses search; pasting a link anywhere opens the saver.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    const onPaste = (e) => {
      if (/input|textarea/i.test(document.activeElement?.tagName) || editing) return;
      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;
      if (looksLikeUrl(text)) setEditing({ ...EMPTY, url: text, autoFetch: true });
      else setEditing({ ...EMPTY, kind: "text", content: text.slice(0, 20000) });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
    };
  }, [editing]);

  const patch = async (b, change) => {
    setItems((list) => list.map((x) => (x._id === b._id ? { ...x, ...change } : x)));
    try {
      await api.patch(`/bookmarks/${b._id}`, change);
      api.get("/bookmarks/facets").then((r) => setFacets(data(r))).catch(() => {});
    } catch (e) {
      fail(e);
      load();
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete “${b.title}”?`)) return;
    setItems((list) => list.filter((x) => x._id !== b._id));
    await api.delete(`/bookmarks/${b._id}`).catch((e) => fail(e));
    load();
  };

  const open = (b) => {
    if (b.kind === "text" || !b.url) return setEditing(b);
    window.open(b.url, "_blank", "noopener,noreferrer");
    api.post(`/bookmarks/${b._id}/open`).catch(() => {});
    if (b.status === "unread") patch(b, { status: "read" });
  };

  const quickAdd = (e) => {
    e.preventDefault();
    const text = quick.trim();
    if (!text) return setEditing({ ...EMPTY });
    setEditing(looksLikeUrl(text) ? { ...EMPTY, url: text, autoFetch: true } : { ...EMPTY, kind: "text", title: text.length <= 80 ? text : "", content: text.length > 80 ? text : "" });
    setQuick("");
  };

  const importFile = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const list = /\.json$/i.test(file.name) ? parseBookmarkJson(text) : parseBookmarkHtml(text);
      if (!list.length) throw new Error("No bookmarks found in that file");
      let created = 0;
      let skipped = 0;
      for (let i = 0; i < list.length; i += 500) {
        const r = data(await api.post("/bookmarks/bulk", { items: list.slice(i, i + 500) }));
        created += r.created;
        skipped += r.skipped;
      }
      toast.success(`Imported ${created} bookmark${created === 1 ? "" : "s"}${skipped ? ` · ${skipped} already saved` : ""}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const exportAs = async (kind) => {
    try {
      const all = data(await api.get("/bookmarks", { params: { sort: "title" } }));
      const stamp = new Date().toISOString().slice(0, 10);
      if (kind === "html") downloadText(`bookmarks-${stamp}.html`, toBookmarkHtml(all), "text/html");
      if (kind === "json") downloadText(`bookmarks-${stamp}.json`, JSON.stringify({ exportedAt: new Date(), bookmarks: all }, null, 2), "application/json");
      if (kind === "csv") downloadText(`bookmarks-${stamp}.csv`, toBookmarkCsv(all), "text/csv");
    } catch (e) {
      fail(e, "Export failed");
    }
  };

  const countOf = (list, value) => list.find((x) => x.value === value)?.count || 0;
  const nav = [
    { type: "all", label: "All", icon: BookmarkIcon, count: facets.total },
    { type: "pinned", label: "Pinned", icon: Star },
    { type: "unread", label: "Reading list", icon: Inbox, count: countOf(facets.statuses, "unread") },
    { type: "text", label: "Snippets", icon: FileText, count: countOf(facets.kinds, "text") },
  ];
  const navBtn = (active) => `flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-small transition ${active ? "bg-surface font-medium text-primary" : "text-secondary hover:bg-surface/60 hover:text-primary"}`;
  const pinned = items?.filter((b) => b.pinned) || [];
  const rest = items?.filter((b) => !b.pinned || filter.type === "pinned") || [];
  const showPinnedRow = filter.type === "all" && !q && pinned.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <BookmarkIcon size={28} /> Bookmarks
          </h1>
          <p className="text-body mt-2">Links, snippets and things to read — paste a link anywhere here to save it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary" title="Import a bookmarks file exported from Chrome, Edge, Safari or Firefox (or a JSON backup)">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import
          </button>
          <input ref={fileRef} type="file" accept=".html,.htm,.json" hidden onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="relative">
            <select onChange={(e) => { if (e.target.value) exportAs(e.target.value); e.target.value = ""; }} defaultValue="" className="appearance-none rounded-xl border border-border bg-transparent py-2 pl-8 pr-3 text-xs hover:border-primary" aria-label="Export">
              <option value="" disabled>
                Export
              </option>
              <option value="html">Browser file (.html)</option>
              <option value="json">Backup (.json)</option>
              <option value="csv">Spreadsheet (.csv)</option>
            </select>
            <Download size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <form onSubmit={quickAdd} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 focus-within:border-primary">
          <Plus size={16} className="shrink-0 text-muted" />
          <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Paste a link or type a note to save…" className="h-12 min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
          <button type="submit" className="rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-background">
            Save
          </button>
        </form>
        <div className="flex items-center gap-2">
          <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 focus-within:border-primary lg:w-72">
            <Search size={15} className="text-muted" />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search  /" className="min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 rounded-2xl border border-border bg-card px-2 text-xs" aria-label="Sort">
            <option value="recent">Newest</option>
            <option value="opened">Most opened</option>
            <option value="title">A–Z</option>
          </select>
          <div className="flex h-12 items-center rounded-2xl border border-border bg-card p-1">
            {[
              ["grid", LayoutGrid],
              ["list", List],
            ].map(([v, Icon]) => (
              <button key={v} type="button" onClick={() => { setView(v); try { localStorage.setItem("bookmarks:view", v); } catch { /* ignore */ } }} className={`rounded-xl p-2 ${view === v ? "bg-surface text-primary" : "text-muted"}`} aria-label={`${v} view`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-0 lg:self-start">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:block lg:space-y-0.5">
            {nav.map(({ type, label, icon: Icon, count }) => (
              <button key={type} type="button" onClick={() => setFilter({ type, value: "" })} className={`${navBtn(filter.type === type)} shrink-0 lg:shrink`}>
                <Icon size={15} /> <span className="flex-1 text-left">{label}</span>
                {count > 0 && <span className="text-[11px] text-muted">{count}</span>}
              </button>
            ))}
          </div>
          {facets.categories.length > 0 && (
            <div>
              <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted">Categories</p>
              <div className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:block lg:space-y-0.5">
                {facets.categories.map((c) => (
                  <button key={c.value || "none"} type="button" onClick={() => setFilter({ type: "category", value: c.value })} className={`${navBtn(filter.type === "category" && filter.value === c.value)} shrink-0 lg:shrink`}>
                    <Folder size={14} /> <span className="flex-1 truncate text-left">{c.value || "Uncategorised"}</span>
                    <span className="text-[11px] text-muted">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {facets.tags.length > 0 && (
            <div>
              <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted">Tags</p>
              <div className="flex flex-wrap gap-1 px-1.5">
                {facets.tags.slice(0, 30).map((t) => (
                  <button key={t.value} type="button" onClick={() => setFilter(filter.type === "tag" && filter.value === t.value ? { type: "all", value: "" } : { type: "tag", value: t.value })} className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] ${filter.type === "tag" && filter.value === t.value ? "border-primary bg-primary text-background" : "border-border text-secondary hover:border-primary"}`}>
                    <Hash size={10} />
                    {t.value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-6">
          {!items ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-surface" />)}</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <BookmarkIcon size={28} className="mx-auto text-muted" />
              <p className="mt-3 text-small font-medium">{q || filter.type !== "all" ? "Nothing matches." : "Nothing saved yet"}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted">Paste a link anywhere on this page, use the box above, or import your browser&apos;s bookmarks file.</p>
            </div>
          ) : (
            <>
              {showPinnedRow && (
                <section>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
                    <Pin size={13} /> Pinned
                  </p>
                  <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
                    {pinned.map((b) => (
                      <Card key={b._id} b={b} view={view} onOpen={open} onPatch={patch} onEdit={setEditing} onDelete={remove} />
                    ))}
                  </div>
                </section>
              )}
              <motion.div layout className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
                <AnimatePresence initial={false}>
                  {(showPinnedRow ? rest : items).map((b) => (
                    <Card key={b._id} b={b} view={view} onOpen={open} onPatch={patch} onEdit={setEditing} onDelete={remove} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {editing && (
        <Editor
          initial={editing}
          facets={facets}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setEditing(null);
            toast.success(isNew ? "Saved" : "Updated");
            load();
          }}
        />
      )}
    </div>
  );
}

function Bookmarks() {
  return (
    <LifeGate>
      <BookmarksBody />
    </LifeGate>
  );
}

export default Bookmarks;
