import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Palette,
  Type,
  LayoutList,
  Sparkles,
  History,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Lock,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  RotateCw,
  ExternalLink,
  Check,
  Undo2,
  Download,
  Upload,
  RotateCcw,
  Save,
} from "lucide-react";

import {
  COLOR_FIELDS,
  DEFAULT_APPEARANCE,
  FONTS,
  PRESETS,
  SECTION_DEFS,
  ensureFont,
  normalizeAppearance,
  setAppearance,
} from "../../lib/appearance";
import {
  getAppearanceAdmin,
  resetAppearance,
  restoreAppearance,
  saveAppearance,
} from "../services/appearance.service";
import ConfirmModal from "../components/ui/ConfirmModal";

/* ========================================
   APPEARANCE — customize the public site:
   theme presets, light/dark colours, fonts,
   shape, effects and the homepage section
   order (drag and drop). Every change shows
   instantly in the live preview (the real
   site in an iframe, fed drafts by
   postMessage); nothing goes live until
   Save. Previous saves can be restored.
========================================= */

const TABS = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "type", label: "Typography", icon: Type },
  { id: "layout", label: "Sections", icon: LayoutList },
  { id: "style", label: "Style", icon: Sparkles },
  { id: "history", label: "History", icon: History },
];

const SECTION_BY_ID = new Map(SECTION_DEFS.map((s) => [s.id, s]));

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

/* ---------- contrast (WCAG) ---------- */

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function ContrastBadge({ fg, bg, label }) {
  const ratio = contrast(fg, bg);
  const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Low";
  const good = ratio >= 4.5;

  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2">
      <span className="text-xs text-secondary">{label}</span>
      <span className={`text-xs font-medium ${good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
        {ratio.toFixed(1)}:1 · {level}
      </span>
    </div>
  );
}

/* ---------- small controls ---------- */

function Segmented({ value, onChange, options, size = "md" }) {
  // Unique per control, so two switches with the same options don't
  // share (and fight over) one sliding highlight.
  const id = useId();

  return (
    <div className="inline-flex rounded-control border border-border bg-surface p-1 gap-1" role="radiogroup">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`relative inline-flex items-center gap-1.5 rounded-[12px] ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} transition-colors ${
              active ? "text-primary" : "text-secondary hover:text-primary"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[12px] bg-background border border-border shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            {Icon && <Icon size={14} className="relative" />}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <span>
        <span className="text-label block">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-surface border border-border"}`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow transition-transform duration-200 ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, format, left, right }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-label">{label}</span>
        <span className="text-xs font-mono text-muted">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current text-primary cursor-pointer"
        aria-label={label}
      />
      {(left || right) && (
        <div className="flex justify-between text-[11px] text-muted">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  );
}

function ColorField({ field, value, onChange }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);

  // Keep the text box in step when the colour changes from elsewhere
  // (preset, picker) — adjusted during render, not in an effect.
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }

  const commit = () => {
    const hex = text.trim().startsWith("#") ? text.trim() : `#${text.trim()}`;
    if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toLowerCase());
    else setText(value);
  };

  return (
    <div className="flex items-center gap-3 rounded-control border border-border bg-surface/60 p-2.5">
      <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-border" style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={field.label}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-[11px] text-muted truncate">{field.hint}</p>
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        spellCheck={false}
        className="w-[84px] rounded-[10px] border border-border bg-background px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-primary"
        aria-label={`${field.label} hex`}
      />
    </div>
  );
}

const FONT_GROUPS = [
  { category: "sans", label: "Sans-serif" },
  { category: "display", label: "Display" },
  { category: "serif", label: "Serif" },
  { category: "mono", label: "Monospace" },
];

function FontPicker({ label, hint, value, onChange, sample, italic, categories }) {
  useEffect(() => {
    ensureFont(value);
  }, [value]);

  return (
    <div className="rounded-control border border-border bg-surface/60 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label">{label}</p>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 max-w-[190px] rounded-[10px] border border-border bg-background px-2 text-sm outline-none focus:border-primary"
          aria-label={label}
        >
          {FONT_GROUPS.filter((g) => !categories || categories.includes(g.category)).map((group) => (
            <optgroup key={group.category} label={group.label}>
              {FONTS.filter((f) => f.category === group.category).map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="truncate text-2xl leading-tight" style={{ fontFamily: `"${value}"`, fontStyle: italic ? "italic" : undefined }}>
        {sample}
      </p>
    </div>
  );
}

/* ---------- sections (drag and drop) ---------- */

function SectionRow({ section, number, isFirst, isLast, onToggle, onMove }) {
  const controls = useDragControls();
  const def = SECTION_BY_ID.get(section.id);

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      layout="position"
      className="list-none"
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -18px rgba(0,0,0,0.35)", zIndex: 10 }}
    >
      <div
        className={`flex items-center gap-3 rounded-control border bg-card px-3 py-2.5 transition-colors ${
          section.visible ? "border-border" : "border-dashed border-border opacity-60"
        }`}
      >
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            controls.start(e);
          }}
          className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary active:cursor-grabbing"
          aria-label={`Drag ${def.label}`}
        >
          <GripVertical size={18} />
        </button>

        <span className="w-7 shrink-0 text-center font-mono text-xs text-muted">{number ?? "—"}</span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{def.label}</p>
          <p className="text-xs text-muted truncate">{def.hint}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={`Move ${def.label} up`}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={`Move ${def.label} down`}
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-lg p-1.5 hover:bg-surface ${section.visible ? "text-primary" : "text-muted"}`}
            aria-label={section.visible ? `Hide ${def.label}` : `Show ${def.label}`}
            title={section.visible ? "Visible — click to hide" : "Hidden — click to show"}
          >
            {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

function PinnedRow({ label, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-border bg-surface/50 px-3 py-2.5">
      <span className="p-1.5 text-muted">
        <Lock size={16} />
      </span>
      <span className="w-7" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}

/* ---------- live preview ---------- */

const DEVICE_WIDTH = { desktop: 1280, mobile: 390 };

function Preview({ draft, mode, setMode, device, setDevice }) {
  const frameRef = useRef(null);
  const boxRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [readyTick, setReadyTick] = useState(0);
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The site inside the iframe announces itself once it can take drafts.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "appearance:preview-ready") setReadyTick((n) => n + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!readyTick) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "appearance:preview", config: draft, mode },
      window.location.origin,
    );
  }, [draft, mode, readyTick]);

  const logicalWidth = DEVICE_WIDTH[device];
  const scale = box.width ? Math.min(1, (device === "mobile" ? Math.min(box.width, 420) : box.width) / logicalWidth) : 1;
  const frameHeight = box.height ? box.height / scale : 800;

  return (
    <div className="card p-0! overflow-hidden flex flex-col h-[calc(100vh-11rem)] min-h-[520px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium">Live preview</span>
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
            ]}
          />
          <Segmented
            size="sm"
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: "Desktop", icon: Monitor },
              { value: "mobile", label: "Mobile", icon: Smartphone },
            ]}
          />
          <button
            type="button"
            onClick={() => setFrameKey((k) => k + 1)}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary"
            title="Reload preview"
            aria-label="Reload preview"
          >
            <RotateCw size={15} />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary"
            title="Open the live site"
            aria-label="Open the live site"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      <div ref={boxRef} className="relative flex-1 overflow-hidden bg-surface/60">
        <div
          className={`absolute top-0 ${device === "mobile" ? "left-1/2 -translate-x-1/2 border-x border-border shadow-xl" : "left-0"}`}
          style={{ width: logicalWidth * scale, height: "100%" }}
        >
          <iframe
            key={frameKey}
            ref={frameRef}
            src="/?preview=1"
            title="Site preview"
            className="origin-top-left border-0 bg-white"
            style={{ width: logicalWidth, height: frameHeight, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

function Appearance({ initialTab = "theme" }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [meta, setMeta] = useState({ customized: false, updatedAt: null, updatedBy: "", history: [] });

  // Preset names are shown in their own heading font.
  useEffect(() => {
    PRESETS.forEach((preset) => ensureFont(preset.typography.headingFont));
  }, []);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [editMode, setEditMode] = useState("light");
  const [previewMode, setPreviewMode] = useState("light");
  const [device, setDevice] = useState("desktop");
  const [confirm, setConfirm] = useState(null);
  const importRef = useRef(null);

  const applyServer = useCallback((data) => {
    const config = normalizeAppearance(data.config);
    setSaved(config);
    setDraft(config);
    setMeta({
      // No saved config = the site runs on its built-in look.
      customized: Boolean(data.config),
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
      history: data.history || [],
    });
    // Refresh this browser's cached copy, so the public site here shows
    // the saved look on the next visit without waiting for the fetch.
    setAppearance(data.config);
  }, []);

  const load = useCallback(() => {
    setLoadError(false);
    getAppearanceAdmin()
      .then(applyServer)
      .catch(() => setLoadError(true));
  }, [applyServer]);

  useEffect(() => {
    getAppearanceAdmin()
      .then(applyServer)
      .catch(() => setLoadError(true));
  }, [applyServer]);

  const dirty = Boolean(draft && saved && !same(draft, saved));

  /* ----- edits ----- */

  const patch = (fn) => setDraft((d) => normalizeAppearance(fn(structuredClone(d))));

  const setColor = (key, value) =>
    patch((d) => {
      d.colors[editMode][key] = value;
      d.preset = "";
      return d;
    });

  const applyPreset = (preset) =>
    patch((d) => {
      d.colors = structuredClone(preset.colors);
      d.typography = { ...d.typography, ...preset.typography };
      d.preset = preset.id;
      return d;
    });

  const setTypography = (key, value) => patch((d) => ({ ...d, typography: { ...d.typography, [key]: value } }));
  const setShape = (key, value) => patch((d) => ({ ...d, shape: { ...d.shape, [key]: value } }));
  const setEffect = (key, value) => patch((d) => ({ ...d, effects: { ...d.effects, [key]: value } }));
  const setSections = (sections) => setDraft((d) => ({ ...d, sections }));

  const moveSection = (index, delta) =>
    setDraft((d) => {
      const sections = [...d.sections];
      const target = index + delta;
      if (target < 0 || target >= sections.length) return d;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });

  const toggleSection = (id) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    }));

  /* ----- actions ----- */

  const save = useCallback(async () => {
    if (!draft || busy) return;
    setBusy(true);
    try {
      applyServer(await saveAppearance(draft));
      toast.success("Appearance saved — it's live on your site");
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Couldn't save appearance");
    } finally {
      setBusy(false);
    }
  }, [draft, busy, applyServer]);

  const runConfirmed = async () => {
    const action = confirm;
    setBusy(true);
    try {
      if (action.type === "reset") {
        applyServer(await resetAppearance());
        toast.success("Back to the original look");
      } else if (action.type === "restore") {
        applyServer(await restoreAppearance(action.index));
        toast.success("Version restored");
      }
      setConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appearance-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setDraft(normalizeAppearance(parsed));
      toast.success("Imported — review it in the preview, then Save");
    } catch {
      toast.error("That file isn't a valid appearance export");
    }
  };

  // Ctrl/⌘+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    };
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, save]);

  const numbers = useMemo(() => {
    const map = new Map();
    let n = 0;
    draft?.sections.forEach((s) => {
      if (s.visible && s.id !== "marquee") map.set(s.id, String(++n).padStart(2, "0"));
    });
    return map;
  }, [draft]);

  if (loadError) {
    return (
      <div className="card text-center space-y-4 py-12">
        <p className="text-title">Couldn&apos;t load appearance settings</p>
        <p className="text-small">Check your connection and try again.</p>
        <button type="button" onClick={load} className="h-control px-control rounded-control bg-primary text-background font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] animate-pulse">
        <div className="space-y-4">
          <div className="card h-20" />
          <div className="card h-96" />
        </div>
        <div className="card h-[600px]" />
      </div>
    );
  }

  const palette = draft.colors[editMode];
  const t = draft.typography;

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-heading">Appearance</h2>
          <p className="text-small mt-2 max-w-xl">
            Colours, fonts, shape and section order for your public site. Changes preview live on the right and go
            live when you save.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            {dirty ? (
              <motion.span
                key="dirty"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Unsaved changes
              </motion.span>
            ) : (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-1.5 text-xs text-muted"
              >
                <Check size={13} /> {meta.customized ? `Saved ${fmtDate(meta.updatedAt)}` : "Using the original look"}
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setDraft(saved)}
            disabled={!dirty || busy}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-medium transition hover:border-border-strong disabled:opacity-40"
          >
            <Undo2 size={15} /> Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy}
            className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            title="Save (Ctrl+S)"
          >
            <Save size={15} /> {busy ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start">
        {/* Controls */}
        <div className="space-y-4 min-w-0">
          <div className="card p-1.5! flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-control px-3 py-2.5 text-sm transition-colors ${
                  tab === id ? "text-primary font-medium" : "text-secondary hover:text-primary"
                }`}
              >
                {tab === id && (
                  <motion.span
                    layoutId="appearance-tab"
                    className="absolute inset-0 rounded-control bg-surface border border-border"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={16} className="relative" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {tab === "theme" && (
                <>
                  <div className="card space-y-4">
                    <div>
                      <h3 className="text-title">Presets</h3>
                      <p className="text-small">A full colour and font set in one click — fine-tune anything after.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PRESETS.map((preset) => {
                        const active = draft.preset === preset.id;
                        const { light, dark } = preset.colors;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`group relative text-left rounded-control border p-3 transition ${
                              active ? "border-primary ring-1 ring-primary" : "border-border hover:border-border-strong"
                            }`}
                          >
                            <div className="flex h-14 overflow-hidden rounded-[12px] border border-border">
                              <div className="flex flex-1 items-end gap-1 p-2" style={{ background: light.background }}>
                                <span className="h-5 flex-1 rounded" style={{ background: light.card, border: `1px solid ${light.border}` }} />
                                <span className="h-3 w-3 rounded-full" style={{ background: light.accent }} />
                                <span className="h-3 w-3 rounded-full" style={{ background: light.primary }} />
                              </div>
                              <div className="flex flex-1 items-end gap-1 p-2" style={{ background: dark.background }}>
                                <span className="h-5 flex-1 rounded" style={{ background: dark.card, border: `1px solid ${dark.border}` }} />
                                <span className="h-3 w-3 rounded-full" style={{ background: dark.accent }} />
                                <span className="h-3 w-3 rounded-full" style={{ background: dark.primary }} />
                              </div>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-sm font-medium" style={{ fontFamily: `"${preset.typography.headingFont}"` }}>
                                {preset.name}
                              </span>
                              {active && <Check size={15} />}
                            </div>
                            <p className="text-xs text-muted mt-0.5">{preset.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-title">Colours</h3>
                        <p className="text-small">Each mode has its own palette.</p>
                      </div>
                      <Segmented
                        value={editMode}
                        onChange={(m) => {
                          setEditMode(m);
                          setPreviewMode(m);
                        }}
                        options={[
                          { value: "light", label: "Light", icon: Sun },
                          { value: "dark", label: "Dark", icon: Moon },
                        ]}
                      />
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {COLOR_FIELDS.map((field) => (
                        <ColorField key={`${editMode}-${field.key}`} field={field} value={palette[field.key]} onChange={(v) => setColor(field.key, v)} />
                      ))}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <ContrastBadge label="Text" fg={palette.primary} bg={palette.background} />
                      <ContrastBadge label="Secondary" fg={palette.secondary} bg={palette.background} />
                      <ContrastBadge label="On cards" fg={palette.primary} bg={palette.card} />
                    </div>
                  </div>

                  <div className="card space-y-3">
                    <div>
                      <h3 className="text-title">Default mode</h3>
                      <p className="text-small">What first-time visitors see. Their own toggle always wins.</p>
                    </div>
                    <Segmented
                      value={draft.defaultMode}
                      onChange={(v) => patch((d) => ({ ...d, defaultMode: v }))}
                      options={[
                        { value: "system", label: "Match device", icon: Monitor },
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                      ]}
                    />
                  </div>
                </>
              )}

              {tab === "type" && (
                <>
                  <div className="card space-y-3">
                    <div>
                      <h3 className="text-title">Fonts</h3>
                      <p className="text-small">Free Google Fonts, loaded only when used.</p>
                    </div>
                    <FontPicker
                      label="Headings"
                      hint="Hero name and section titles"
                      value={t.headingFont}
                      onChange={(v) => setTypography("headingFont", v)}
                      sample="Building verifiable systems"
                    />
                    <FontPicker
                      label="Body"
                      hint="Paragraphs, navigation, buttons"
                      value={t.bodyFont}
                      onChange={(v) => setTypography("bodyFont", v)}
                      sample="Clean architecture, real results."
                    />
                    <FontPicker
                      label="Accent"
                      hint="Italic words inside headings"
                      value={t.accentFont}
                      onChange={(v) => setTypography("accentFont", v)}
                      sample="thoughtfully crafted"
                      italic
                    />
                    <FontPicker
                      label="Monospace"
                      hint="Eyebrows, numbers, code"
                      value={t.monoFont}
                      onChange={(v) => setTypography("monoFont", v)}
                      sample="01 — RESEARCH"
                      categories={["mono", "sans"]}
                    />
                  </div>

                  <div className="card space-y-6">
                    <h3 className="text-title">Sizing & weight</h3>
                    <Slider
                      label="Base text size"
                      value={t.baseSize}
                      min={14}
                      max={18}
                      step={0.5}
                      onChange={(v) => setTypography("baseSize", v)}
                      format={(v) => `${v}px`}
                      left="Compact"
                      right="Large"
                    />
                    <Slider
                      label="Heading weight"
                      value={t.headingWeight}
                      min={300}
                      max={900}
                      step={100}
                      onChange={(v) => setTypography("headingWeight", v)}
                      left="Light"
                      right="Black"
                    />
                    <Slider
                      label="Heading letter spacing"
                      value={t.headingTracking}
                      min={0}
                      max={1.5}
                      step={0.1}
                      onChange={(v) => setTypography("headingTracking", v)}
                      format={(v) => (v === 1 ? "Default" : `${Math.round(v * 100)}%`)}
                      left="Open"
                      right="Tight"
                    />

                    <div className="rounded-control border border-border bg-surface/60 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted" style={{ fontFamily: `"${t.monoFont}"` }}>
                        01 — Specimen
                      </p>
                      <p
                        className="mt-3 text-4xl leading-none"
                        style={{
                          fontFamily: `"${t.headingFont}"`,
                          fontWeight: t.headingWeight,
                          letterSpacing: `${-0.05 * t.headingTracking}em`,
                        }}
                      >
                        Engineering{" "}
                        <span style={{ fontFamily: `"${t.accentFont}"`, fontStyle: "italic", fontWeight: 400 }}>with care</span>
                      </p>
                      <p className="mt-3 text-secondary" style={{ fontFamily: `"${t.bodyFont}"`, fontSize: `${t.baseSize}px` }}>
                        Production-grade backends and verifiable blockchain systems, built with clean architecture.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {tab === "layout" && (
                <div className="card space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-title">Homepage sections</h3>
                      <p className="text-small">Drag to reorder, or use the arrows. The eye hides a section and its menu link.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSections(draft.sections.map((s) => ({ ...s, visible: true })))}
                        className="h-9 rounded-control border border-border bg-surface px-3 text-xs font-medium hover:border-border-strong"
                      >
                        Show all
                      </button>
                      <button
                        type="button"
                        onClick={() => setSections(structuredClone(DEFAULT_APPEARANCE.sections))}
                        className="h-9 rounded-control border border-border bg-surface px-3 text-xs font-medium hover:border-border-strong"
                      >
                        Default order
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <PinnedRow label="Hero" hint="Always first — your name and introduction" />
                    <Reorder.Group axis="y" values={draft.sections} onReorder={setSections} className="space-y-2">
                      {draft.sections.map((section, index) => (
                        <SectionRow
                          key={section.id}
                          section={section}
                          number={numbers.get(section.id)}
                          isFirst={index === 0}
                          isLast={index === draft.sections.length - 1}
                          onToggle={() => toggleSection(section.id)}
                          onMove={(delta) => moveSection(index, delta)}
                        />
                      ))}
                    </Reorder.Group>
                    <PinnedRow label="Footer" hint="Always last" />
                  </div>

                  <p className="text-xs text-muted">
                    {draft.sections.filter((s) => s.visible).length} of {draft.sections.length} sections visible. Section
                    numbers (01, 02…) follow this order automatically.
                  </p>
                </div>
              )}

              {tab === "style" && (
                <>
                  <div className="card space-y-6">
                    <h3 className="text-title">Shape</h3>
                    <Slider
                      label="Corner roundness"
                      value={draft.shape.roundness}
                      min={0}
                      max={1.5}
                      step={0.05}
                      onChange={(v) => setShape("roundness", v)}
                      format={(v) => (v === 1 ? "Default" : `${Math.round(v * 100)}%`)}
                      left="Square"
                      right="Round"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {[28, 24, 18].map((r, i) => (
                        <div
                          key={r}
                          className="h-16 border border-border bg-surface"
                          style={{ borderRadius: r * draft.shape.roundness }}
                          aria-hidden
                          title={["Panels", "Cards", "Controls"][i]}
                        />
                      ))}
                    </div>

                    <div className="space-y-3">
                      <p className="text-label">Buttons</p>
                      <Segmented
                        value={draft.shape.buttons}
                        onChange={(v) => setShape("buttons", v)}
                        options={[
                          { value: "pill", label: "Pill" },
                          { value: "rounded", label: "Rounded" },
                          { value: "square", label: "Square" },
                        ]}
                      />
                      <div className="flex flex-wrap gap-3 pt-1">
                        {(() => {
                          const radius = { pill: 999, rounded: 14 * draft.shape.roundness, square: 0 }[draft.shape.buttons];
                          const fill = draft.effects.accentButtons ? palette.accent : palette.primary;
                          return (
                            <>
                              <span className="inline-flex h-11 items-center px-5 text-sm font-medium" style={{ borderRadius: radius, background: fill, color: palette.background }}>
                                Read the research
                              </span>
                              <span
                                className="inline-flex h-11 items-center px-5 text-sm font-medium"
                                style={{ borderRadius: radius, border: `1px solid ${palette.borderStrong}`, color: palette.primary, background: palette.background }}
                              >
                                Get in touch
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <Toggle
                        label="Accent-coloured buttons"
                        hint="Primary buttons use the accent colour instead of the text colour"
                        checked={draft.effects.accentButtons}
                        onChange={(v) => setEffect("accentButtons", v)}
                      />
                    </div>
                  </div>

                  <div className="card divide-y divide-border">
                    <h3 className="text-title pb-3">Effects</h3>
                    <Toggle label="Film grain" hint="Subtle texture over the page" checked={draft.effects.grain} onChange={(v) => setEffect("grain", v)} />
                    <Toggle label="Custom cursor" hint="Follows the pointer on desktop" checked={draft.effects.cursor} onChange={(v) => setEffect("cursor", v)} />
                    <Toggle label="Smooth scrolling" hint="Inertia scrolling on the homepage" checked={draft.effects.smoothScroll} onChange={(v) => setEffect("smoothScroll", v)} />
                    <Toggle label="Section numbers" hint="The 01, 02… before each section heading" checked={draft.effects.sectionNumbers} onChange={(v) => setEffect("sectionNumbers", v)} />
                  </div>
                </>
              )}

              {tab === "history" && (
                <>
                  <div className="card space-y-4">
                    <div>
                      <h3 className="text-title">Version history</h3>
                      <p className="text-small">Your last {meta.history.length || "few"} saves. Restoring publishes that version.</p>
                    </div>
                    {meta.history.length ? (
                      <ul className="space-y-2">
                        {meta.history.map((entry) => (
                          <li key={entry.index} className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface/60 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{fmtDate(entry.savedAt)}</p>
                              <p className="text-xs text-muted truncate">
                                {PRESETS.find((p) => p.id === entry.preset)?.name || "Custom"}
                                {entry.savedBy ? ` · ${entry.savedBy}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirm({ type: "restore", index: entry.index })}
                              className="inline-flex h-9 items-center gap-1.5 rounded-control border border-border bg-background px-3 text-xs font-medium hover:border-border-strong"
                            >
                              <RotateCcw size={13} /> Restore
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-control border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                        No earlier versions yet — they appear here after your next save.
                      </p>
                    )}
                  </div>

                  <div className="card space-y-3">
                    <h3 className="text-title">Backup</h3>
                    <p className="text-small">Download the current draft as a file, or load one back in.</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={exportJson} className="inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-medium hover:border-border-strong">
                        <Download size={15} /> Export JSON
                      </button>
                      <button type="button" onClick={() => importRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-medium hover:border-border-strong">
                        <Upload size={15} /> Import JSON
                      </button>
                      <input
                        ref={importRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          importJson(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>

                  <div className="card space-y-3 border-red-500/30!">
                    <h3 className="text-title">Reset</h3>
                    <p className="text-small">Return the live site to its original monochrome look. The current version stays in history.</p>
                    <button
                      type="button"
                      onClick={() => setConfirm({ type: "reset" })}
                      className="inline-flex h-10 items-center gap-2 rounded-control border border-red-500/40 px-4 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    >
                      <RotateCcw size={15} /> Reset to original
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-0 min-w-0">
          <Preview draft={draft} mode={previewMode} setMode={setPreviewMode} device={device} setDevice={setDevice} />
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm?.type === "reset" ? "Reset to the original look?" : "Restore this version?"}
        message={
          confirm?.type === "reset"
            ? "Your live site goes back to the built-in monochrome design. You can restore the current version from History."
            : "This version replaces what's live now. The current version is kept in History."
        }
        confirmText={confirm?.type === "reset" ? "Reset" : "Restore"}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
        loading={busy}
      />
    </div>
  );
}

export default Appearance;
