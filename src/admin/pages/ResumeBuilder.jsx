import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Download,
  Save,
  Share2,
  Link2,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  Pencil,
  Check,
  Globe,
  Lock,
  Star,
  ExternalLink,
  LayoutList,
  UserRound,
  Palette,
  QrCode as QrIcon,
  RotateCcw,
  PenLine,
} from "lucide-react";

import ResumeDocument from "../../components/resume/ResumeDocument";
import { ResumePrintPortal } from "../../components/resume/ResumePrint";
import { printResume } from "../../components/resume/printResume";
import { TEMPLATES, TEMPLATE_BY_ID, RESUME_FONTS, SECTION_LABELS, defaultConfig, dateRange, yearRange, toBullets } from "../../components/resume/resumeModel";
import { getResumes, getResumeSource, createResume, updateResume, duplicateResume, deleteResume } from "../services/resume.service";
import ConfirmModal from "../components/ui/ConfirmModal";
import { SITE_URL } from "../../lib/site";
import { downloadUrl, svgToPng } from "../../lib/qrExport";

/* ========================================
   RESUME BUILDER — tick exactly what goes on
   each resume (every project, job, skill…),
   reorder and rewrite it, pick one of ten
   ATS-friendly templates, then download a
   PDF or share a live link / QR code.
========================================= */

const TABS = [
  { id: "content", label: "Content", icon: LayoutList },
  { id: "header", label: "Header", icon: UserRound },
  { id: "design", label: "Design", icon: Palette },
  { id: "share", label: "Share", icon: Share2 },
];

const ACCENTS = ["#111111", "#1e293b", "#2563eb", "#0f766e", "#15803d", "#7c2d12", "#7c3aed", "#be123c"];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (v) => structuredClone(v);

const ITEM_SECTIONS = {
  experience: { label: (e) => `${e.role} · ${e.company}`, sub: (e) => dateRange(e.startDate, e.endDate, e.isCurrent), defaults: (e) => ({ title: e.role, bullets: toBullets(e.description), tech: (e.technologies || []).join(", ") }), fields: ["title", "bullets", "tech"] },
  projects: { label: (p) => p.title, sub: (p) => p.category || "", defaults: (p) => ({ title: p.title, bullets: p.features?.length ? p.features.slice(0, 4) : toBullets(p.description, 3), tech: (p.technologies || []).slice(0, 8).join(", ") }), fields: ["title", "subtitle", "bullets", "tech"] },
  education: { label: (e) => `${e.degree} · ${e.institution}`, sub: (e) => yearRange(e.startYear, e.endYear, e.current), defaults: (e) => ({ title: e.institution, bullets: [] }), fields: ["title", "subtitle", "bullets"] },
  certificates: { label: (c) => c.title, sub: (c) => [c.issuer, c.year].filter(Boolean).join(" · "), defaults: () => ({}), fields: [] },
};

const inputClass = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-small outline-none transition focus:border-primary";

/* ---------- small pieces ---------- */

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "border border-border bg-surface"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

function Range({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-xs">
        <span className="font-medium text-secondary">{label}</span>
        <span className="font-mono text-muted">{format ? format(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-current text-primary" />
    </label>
  );
}

// Scales a real-size sheet to fit its container; reports page count.
function ScaledSheet({ config, data, compact = false, onPages }) {
  const boxRef = useRef(null);
  const sheetRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(1123);

  useEffect(() => {
    const box = boxRef.current;
    const sheet = sheetRef.current;
    if (!box || !sheet) return undefined;
    const measure = () => {
      const w = sheet.firstChild?.offsetWidth || 794;
      const h = sheet.firstChild?.offsetHeight || 1123;
      setScale(Math.min(1.2, box.clientWidth / w));
      setHeight(h);
      if (onPages) {
        const pageH = config?.style?.pageSize === "letter" ? 1056 : 1123;
        onPages(Math.max(1, Math.ceil((h - 2) / pageH)));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [config, onPages]);

  return (
    <div ref={boxRef} className="w-full overflow-hidden" style={{ height: height * scale }}>
      <div ref={sheetRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "max-content" }} className={compact ? "pointer-events-none" : "shadow-xl"}>
        <ResumeDocument config={config} data={data} siteUrl={SITE_URL} paged={!compact} />
      </div>
    </div>
  );
}

function SectionRow({ section, onToggle, onRename }) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.02, zIndex: 10 }}>
      <div className={`flex items-center gap-2 rounded-xl border bg-card px-2 py-2 ${section.visible ? "border-border" : "border-dashed border-border opacity-60"}`}>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface active:cursor-grabbing" aria-label={`Drag ${section.id}`}>
          <GripVertical size={16} />
        </button>
        {editing ? (
          <input autoFocus defaultValue={section.title || SECTION_LABELS[section.id]} onBlur={(e) => { onRename(e.target.value.trim()); setEditing(false); }} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="min-w-0 flex-1 rounded-lg bg-surface px-2 py-1 text-small outline-none" />
        ) : (
          <span className="min-w-0 flex-1 truncate text-small font-medium">{section.title || SECTION_LABELS[section.id]}</span>
        )}
        <button type="button" onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary" aria-label="Rename section">
          <Pencil size={14} />
        </button>
        <button type="button" onClick={onToggle} className={`rounded-lg p-1.5 hover:bg-surface ${section.visible ? "text-primary" : "text-muted"}`} aria-label={section.visible ? "Hide section" : "Show section"}>
          {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>
    </Reorder.Item>
  );
}

function ItemRow({ item, meta, checked, onCheck, override, onOverride }) {
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const defaults = meta.defaults(item);
  const o = override || {};
  const hasOverride = Object.values(o).some((v) => (Array.isArray(v) ? v.length : v));

  return (
    <Reorder.Item value={item._id} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.01, zIndex: 10 }}>
      <div className={`rounded-xl border ${checked ? "border-border bg-card" : "border-dashed border-border bg-transparent"}`}>
        <div className="flex items-center gap-2 px-2 py-2">
          <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none rounded-lg p-1 text-muted hover:bg-surface" aria-label="Drag to reorder">
            <GripVertical size={15} />
          </button>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} className="h-4 w-4 shrink-0 accent-current" />
            <span className="min-w-0">
              <span className={`block truncate text-small ${checked ? "font-medium" : "text-muted"}`}>{meta.label(item)}</span>
              {meta.sub(item) && <span className="block truncate text-[11px] text-muted">{meta.sub(item)}</span>}
            </span>
          </label>
          {hasOverride && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">edited</span>}
          {meta.fields.length > 0 && (
            <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary" aria-label="Edit text for this resume" aria-expanded={open}>
              <PenLine size={14} />
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-2.5 border-t border-border p-3">
                <p className="text-[11px] text-muted">Changes apply to this resume only — your portfolio stays the same.</p>
                {meta.fields.includes("title") && <input className={inputClass} placeholder={defaults.title || "Title"} value={o.title || ""} onChange={(e) => onOverride({ ...o, title: e.target.value })} aria-label="Title" />}
                {meta.fields.includes("subtitle") && <input className={inputClass} placeholder="Subtitle (e.g. degree, role or award)" value={o.subtitle || ""} onChange={(e) => onOverride({ ...o, subtitle: e.target.value })} aria-label="Subtitle" />}
                {meta.fields.includes("tech") && <input className={inputClass} placeholder={defaults.tech || "Technologies"} value={o.tech || ""} onChange={(e) => onOverride({ ...o, tech: e.target.value })} aria-label="Technologies" />}
                {meta.fields.includes("bullets") && (
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder={(defaults.bullets || []).join("\n") || "One bullet per line"}
                    value={(o.bullets || []).join("\n")}
                    onChange={(e) => onOverride({ ...o, bullets: e.target.value.split("\n").slice(0, 12) })}
                    aria-label="Bullets, one per line"
                  />
                )}
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Bullets: one per line · start with a strong verb and a number</span>
                  {hasOverride && (
                    <button type="button" onClick={() => onOverride({})} className="inline-flex items-center gap-1 hover:text-primary">
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
}

function ItemPicker({ sectionKey, items, config, setConfig }) {
  const meta = ITEM_SECTIONS[sectionKey];
  const selected = useMemo(() => config.selected?.[sectionKey] || [], [config.selected, sectionKey]);
  const order = useMemo(() => {
    const set = new Set(selected);
    return [...selected.filter((id) => items.some((i) => i._id === id)), ...items.filter((i) => !set.has(i._id)).map((i) => i._id)];
  }, [selected, items]);
  const byId = new Map(items.map((i) => [i._id, i]));

  const setSelected = (ids) => setConfig((c) => ({ ...c, selected: { ...c.selected, [sectionKey]: ids } }));

  if (!items.length) {
    return sectionKey === "projects" ? (
      <p className="text-xs text-muted">
        No projects are saved in the admin yet — the portfolio is showing its built-in list. Add them under{" "}
        <a href="/dashboard/projects" className="underline underline-offset-2 hover:text-primary">Projects</a> to pick them here, or use the custom section for now.
      </p>
    ) : (
      <p className="text-xs text-muted">Nothing here yet — add some in the portfolio admin first.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-3 text-[11px]">
        <button type="button" className="text-muted hover:text-primary" onClick={() => setSelected(order)}>Select all</button>
        <button type="button" className="text-muted hover:text-primary" onClick={() => setSelected([])}>None</button>
      </div>
      <Reorder.Group axis="y" values={order} onReorder={(next) => setSelected(next.filter((id) => selected.includes(id)))} className="space-y-1.5">
        {order.map((id) => (
          <ItemRow
            key={id}
            item={byId.get(id)}
            meta={meta}
            checked={selected.includes(id)}
            onCheck={(on) => setSelected(on ? order.filter((x) => x === id || selected.includes(x)) : selected.filter((x) => x !== id))}
            override={config.overrides?.[id]}
            onOverride={(o) =>
              setConfig((c) => {
                const overrides = { ...c.overrides };
                const clean = Object.fromEntries(Object.entries(o).filter(([, v]) => (Array.isArray(v) ? v.some((x) => x.trim()) : v)));
                if (Object.keys(clean).length) overrides[id] = { ...clean, ...(clean.bullets ? { bullets: clean.bullets.filter((b) => b.trim()) } : {}) };
                else delete overrides[id];
                return { ...c, overrides };
              })
            }
          />
        ))}
      </Reorder.Group>
    </div>
  );
}

function SkillsPicker({ skills, config, setConfig }) {
  const selected = new Set(config.selected?.skills || []);
  const groups = useMemo(() => {
    const map = new Map();
    skills.forEach((s) => map.set(s.category, [...(map.get(s.category) || []), s]));
    return [...map.entries()];
  }, [skills]);

  const set = (ids) => setConfig((c) => ({ ...c, selected: { ...c.selected, skills: skills.filter((s) => ids.has(s._id)).map((s) => s._id) } }));
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set(next);
  };

  if (!skills.length) return <p className="text-xs text-muted">No skills yet — add them under Skills.</p>;

  return (
    <div className="space-y-3">
      {groups.map(([category, list]) => {
        const all = list.every((s) => selected.has(s._id));
        return (
          <div key={category}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary">{category}</span>
              <button
                type="button"
                onClick={() => {
                  const next = new Set(selected);
                  list.forEach((s) => (all ? next.delete(s._id) : next.add(s._id)));
                  set(next);
                }}
                className="text-[11px] text-muted hover:text-primary"
              >
                {all ? "None" : "All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((s) => {
                const on = selected.has(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggle(s._id)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${on ? "border-primary bg-primary text-background" : "border-border text-secondary hover:border-border-strong"}`}
                  >
                    {on && <Check size={11} />} {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomSection({ config, setConfig }) {
  const custom = config.custom || { title: "Achievements", items: [] };
  const setCustom = (next) => setConfig((c) => ({ ...c, custom: { ...custom, ...next } }));
  const items = custom.items || [];
  const setItem = (i, patch) => setCustom({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });

  return (
    <div className="space-y-2.5">
      <input className={inputClass} value={custom.title || ""} onChange={(e) => setCustom({ title: e.target.value.slice(0, 60) })} placeholder="Section title, e.g. Achievements, Leadership, Publications" aria-label="Custom section title" />
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border p-2.5">
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <input className={inputClass} value={it.heading || ""} onChange={(e) => setItem(i, { heading: e.target.value })} placeholder="Heading" aria-label="Heading" />
            <input className={inputClass} value={it.date || ""} onChange={(e) => setItem(i, { date: e.target.value })} placeholder="Date" aria-label="Date" />
          </div>
          <input className={inputClass} value={it.subheading || ""} onChange={(e) => setItem(i, { subheading: e.target.value })} placeholder="Subheading (optional)" aria-label="Subheading" />
          <textarea rows={2} className={`${inputClass} resize-y`} value={(it.bullets || []).join("\n")} onChange={(e) => setItem(i, { bullets: e.target.value.split("\n").slice(0, 12) })} placeholder="Bullets, one per line" aria-label="Bullets" />
          <button type="button" onClick={() => setCustom({ items: items.filter((_, j) => j !== i) })} className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-500">
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ))}
      {items.length < 12 && (
        <button type="button" onClick={() => setCustom({ items: [...items, { heading: "", bullets: [] }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
          <Plus size={13} /> Add entry
        </button>
      )}
    </div>
  );
}

function Collapse({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left" aria-expanded={open}>
        <span className="text-small font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {count}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-border p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- page ---------- */

function ResumeBuilder() {
  const [resumes, setResumes] = useState(null);
  const [source, setSource] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [tab, setTab] = useState("content");
  const [mobileView, setMobileView] = useState("edit");
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const qrRef = useRef(null);

  const open = useCallback((resume) => {
    const d = { name: resume.name, slug: resume.slug, isPublic: resume.isPublic, isDefault: resume.isDefault, config: resume.config };
    setActiveId(resume.id);
    setDraft(clone(d));
    setSaved(clone(d));
  }, []);

  useEffect(() => {
    Promise.all([getResumes(), getResumeSource()])
      .then(([list, src]) => {
        setResumes(list);
        setSource(src);
        if (list.length) open(list.find((r) => r.isDefault) || list[0]);
      })
      .catch(() => toast.error("Couldn't load resumes"));
  }, [open]);

  const dirty = Boolean(draft && saved && !same(draft, saved));
  const setConfig = (fn) => setDraft((d) => ({ ...d, config: typeof fn === "function" ? fn(d.config) : fn }));
  const setStyle = (patch) => setConfig((c) => ({ ...c, style: { ...c.style, ...patch } }));
  const setOption = (patch) => setConfig((c) => ({ ...c, options: { ...c.options, ...patch } }));
  const setHeader = (patch) => setConfig((c) => ({ ...c, header: { ...c.header, ...patch } }));

  const create = async () => {
    setBusy(true);
    try {
      const base = slugify(source?.identity?.name || "resume") || "resume";
      const taken = new Set((resumes || []).map((r) => r.slug));
      let slug = resumes?.length ? `${base}-${resumes.length + 1}` : base;
      for (let i = 2; taken.has(slug); i += 1) slug = `${base}-${i}`;
      const created = await createResume({ name: resumes?.length ? `Resume ${resumes.length + 1}` : "Main resume", slug, isPublic: false, config: defaultConfig(source) });
      setResumes((list) => [created, ...(list || [])]);
      open(created);
      toast.success("Resume created — tick what to include");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't create a resume");
    } finally {
      setBusy(false);
    }
  };

  const save = useCallback(async () => {
    if (!draft || !activeId || busy) return;
    setBusy(true);
    try {
      const cleanSlug = slugify(draft.slug);
      const updated = await updateResume(activeId, { ...draft, slug: cleanSlug });
      setResumes((list) => list.map((r) => (r.id === updated.id ? updated : updated.isDefault ? { ...r, isDefault: false } : r)));
      open(updated);
      toast.success("Resume saved");
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Couldn't save");
    } finally {
      setBusy(false);
    }
  }, [draft, activeId, busy, open]);

  const duplicate = async () => {
    setMenuOpen(false);
    try {
      const copy = await duplicateResume(activeId);
      setResumes((list) => [copy, ...list]);
      open(copy);
      toast.success("Duplicated");
    } catch {
      toast.error("Couldn't duplicate");
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteResume(activeId);
      const rest = resumes.filter((r) => r.id !== activeId);
      const list = await getResumes().catch(() => rest);
      setResumes(list);
      setConfirmDelete(false);
      if (list.length) open(list[0]);
      else {
        setActiveId(null);
        setDraft(null);
        setSaved(null);
      }
      toast.success("Resume deleted");
    } catch {
      toast.error("Couldn't delete");
    } finally {
      setBusy(false);
    }
  };

  const switchTo = (resume) => {
    if (dirty && !window.confirm("Discard unsaved changes to this resume?")) return;
    open(resume);
    setMenuOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    };
    const onUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty, save]);

  const shareUrl = draft ? `${SITE_URL}/resume/${slugify(draft.slug)}` : "";
  const shortUrl = draft?.isDefault ? `${SITE_URL}/resume` : shareUrl;

  const share = async () => {
    if (!saved?.isPublic) return toast.info("Make the resume public and save it first");
    try {
      if (navigator.share) await navigator.share({ title: `${source?.identity?.name || ""} — Resume`, url: shortUrl });
      else {
        await navigator.clipboard.writeText(shortUrl);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const downloadQr = async () => {
    try {
      const png = await svgToPng(qrRef.current, { size: 1024, caption: "Scan for my resume" });
      downloadUrl(png, `resume-qr-${slugify(draft.slug)}.png`);
    } catch {
      toast.error("Couldn't create the QR image");
    }
  };

  /* ----- render ----- */

  if (!resumes || !source) {
    return (
      <div className="mx-auto grid w-full max-w-7xl animate-pulse gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="card h-[600px]" />
        <div className="card h-[700px]" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          <FileText size={30} />
        </div>
        <h1 className="text-heading">Resume builder</h1>
        <p className="text-body mt-3">Build ATS-friendly resumes straight from your portfolio. Pick exactly which jobs, projects and skills to show, choose one of ten templates, then download a PDF or share a link.</p>
        <button type="button" onClick={create} disabled={busy} className="mt-6 inline-flex h-12 items-center gap-2 rounded-control bg-primary px-6 font-medium text-background disabled:opacity-50">
          <Plus size={18} /> Create my first resume
        </button>
      </div>
    );
  }

  const config = draft.config;
  const style = { ...(TEMPLATE_BY_ID.get(config.template)?.defaults || {}), ...config.style };
  const header = config.header || {};
  const show = header.show || {};
  const id = source.identity || {};

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex min-w-0 items-center gap-2">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2" aria-expanded={menuOpen}>
            <FileText size={17} className="shrink-0" />
            <span className="truncate font-semibold">{draft.name}</span>
            {saved.isDefault && <Star size={13} className="shrink-0 fill-current text-[var(--color-chart-4)]" />}
            <ChevronDown size={15} className="shrink-0 text-muted" />
          </button>
          <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${saved.isPublic ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-surface text-muted"}`}>
            {saved.isPublic ? <Globe size={12} /> : <Lock size={12} />} {saved.isPublic ? "Public" : "Private"}
          </span>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-border bg-card p-1.5 shadow-2xl">
                  <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Your resumes</p>
                  {resumes.map((r) => (
                    <button key={r.id} type="button" onClick={() => switchTo(r)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-small hover:bg-surface ${r.id === activeId ? "bg-surface font-medium" : ""}`}>
                      <FileText size={14} className="shrink-0 text-muted" />
                      <span className="flex-1 truncate">{r.name}</span>
                      {r.isDefault && <Star size={12} className="fill-current text-[var(--color-chart-4)]" />}
                      {r.isPublic ? <Globe size={12} className="text-muted" /> : <Lock size={12} className="text-muted" />}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-border" />
                  <button type="button" onClick={() => { setMenuOpen(false); create(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-small hover:bg-surface">
                    <Plus size={14} /> New resume
                  </button>
                  <button type="button" onClick={duplicate} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-small hover:bg-surface">
                    <Copy size={14} /> Duplicate this one
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-small text-red-600 hover:bg-surface dark:text-red-400">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {dirty && <span className="hidden md:inline text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          {dirty && (
            <button type="button" onClick={() => setDraft(clone(saved))} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-small text-muted hover:bg-surface hover:text-primary" title="Discard unsaved changes">
              <RotateCcw size={15} /> <span className="hidden sm:inline">Discard</span>
            </button>
          )}
          <button type="button" onClick={() => printResume({ config, name: header.name || id.name })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3.5 text-small font-medium hover:bg-surface">
            <Download size={16} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button type="button" onClick={save} disabled={!dirty || busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-small font-medium text-background disabled:opacity-40" title="Save (Ctrl+S)">
            <Save size={16} /> {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Mobile: edit / preview switch */}
      <div className="flex rounded-xl border border-border bg-surface p-1 lg:hidden">
        {["edit", "preview"].map((v) => (
          <button key={v} type="button" onClick={() => setMobileView(v)} className={`flex-1 rounded-lg py-2 text-small capitalize ${mobileView === v ? "bg-background font-medium shadow-sm" : "text-muted"}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        {/* Editor */}
        <div className={`space-y-4 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          <div className="card p-1.5! flex gap-1">
            {TABS.map(({ id: t, label, icon: Icon }) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-small ${tab === t ? "font-medium text-primary" : "text-secondary hover:text-primary"}`}>
                {tab === t && <motion.span layoutId="resume-tab" className="absolute inset-0 rounded-xl border border-border bg-surface" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <Icon size={15} className="relative" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <div className="card space-y-4">
            {tab === "content" && (
              <>
                <div>
                  <h3 className="text-label mb-1">Sections</h3>
                  <p className="mb-3 text-xs text-muted">Drag to reorder · pencil renames · eye hides</p>
                  <Reorder.Group axis="y" values={config.sections} onReorder={(sections) => setConfig((c) => ({ ...c, sections }))} className="space-y-1.5">
                    {config.sections.map((s) => (
                      <SectionRow
                        key={s.id}
                        section={s}
                        onToggle={() => setConfig((c) => ({ ...c, sections: c.sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)) }))}
                        onRename={(title) => setConfig((c) => ({ ...c, sections: c.sections.map((x) => (x.id === s.id ? { ...x, title: title && title !== SECTION_LABELS[s.id] ? title.slice(0, 60) : undefined } : x)) }))}
                      />
                    ))}
                  </Reorder.Group>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-label">What to include</h3>
                  {["experience", "projects", "education", "certificates"].map((key) => (
                    <Collapse key={key} title={SECTION_LABELS[key]} count={`${(config.selected?.[key] || []).length} / ${(source[key] || []).length}`} defaultOpen={key === "projects"}>
                      <ItemPicker sectionKey={key} items={source[key] || []} config={config} setConfig={setConfig} />
                    </Collapse>
                  ))}
                  <Collapse title={SECTION_LABELS.skills} count={`${(config.selected?.skills || []).length} / ${(source.skills || []).length}`}>
                    <SkillsPicker skills={source.skills || []} config={config} setConfig={setConfig} />
                  </Collapse>
                  <Collapse title="Custom section" count={`${config.custom?.items?.length || 0} entries`}>
                    <CustomSection config={config} setConfig={setConfig} />
                  </Collapse>
                </div>
              </>
            )}

            {tab === "header" && (
              <div className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input className={inputClass} value={header.name || ""} onChange={(e) => setHeader({ name: e.target.value })} placeholder={id.name || "Full name"} aria-label="Name" />
                  <input className={inputClass} value={header.headline ?? ""} onChange={(e) => setHeader({ headline: e.target.value })} placeholder={id.headline || "Headline (optional)"} aria-label="Headline" />
                </div>
                <p className="text-xs text-muted">Contact line — leave a field empty to use your portfolio details; switch off what you don&apos;t want shown.</p>
                {[
                  ["email", "Email", id.email],
                  ["phone", "Phone", id.phone],
                  ["location", "Location", "City, Country"],
                  ["website", "Website", SITE_URL],
                  ["linkedin", "LinkedIn", id.linkedin],
                  ["github", "GitHub", id.github],
                ].map(([key, label, placeholder]) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <Toggle checked={Boolean(show[key])} onChange={(on) => setHeader({ show: { ...show, [key]: on } })} label={`Show ${label}`} />
                    <input className={`${inputClass} ${show[key] ? "" : "opacity-50"}`} value={header[key] || ""} onChange={(e) => setHeader({ [key]: e.target.value })} placeholder={placeholder || label} aria-label={label} />
                  </div>
                ))}
                <div className="pt-2">
                  <label className="text-label mb-1.5 block" htmlFor="resume-summary">Summary</label>
                  <textarea id="resume-summary" rows={5} className={`${inputClass} resize-y`} value={config.summary || ""} onChange={(e) => setConfig((c) => ({ ...c, summary: e.target.value.slice(0, 1200) }))} placeholder="2–3 lines: who you are, what you build, what you want next." />
                  <p className="mt-1 text-right font-mono text-[11px] text-muted">{(config.summary || "").length}/1200</p>
                </div>
              </div>
            )}

            {tab === "design" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-label mb-2.5">Template</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TEMPLATES.map((t) => {
                      const active = t.id === config.template;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig((c) => ({ ...c, template: t.id, style: { ...t.defaults, pageSize: c.style?.pageSize || "a4", sectionSpacing: t.defaults.sectionSpacing ?? 1 } }))}
                          className={`group overflow-hidden rounded-xl border text-left transition ${active ? "border-primary ring-1 ring-primary" : "border-border hover:border-border-strong"}`}
                        >
                          <div className="h-36 overflow-hidden border-b border-border bg-white">
                            <ScaledSheet config={{ ...config, template: t.id, style: { ...t.defaults, pageSize: "a4" } }} data={source} compact />
                          </div>
                          <div className="px-2.5 py-2">
                            <p className="flex items-center justify-between text-small font-semibold">
                              {t.name} {active && <Check size={14} />}
                            </p>
                            <p className="line-clamp-2 text-[11px] text-muted">{t.blurb}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {TEMPLATE_BY_ID.get(config.template)?.order && (
                    <button
                      type="button"
                      onClick={() => {
                        const order = TEMPLATE_BY_ID.get(config.template).order;
                        setConfig((c) => ({ ...c, sections: order.map((sid) => c.sections.find((s) => s.id === sid) || { id: sid, visible: false }) }));
                      }}
                      className="mt-2 text-xs text-muted underline-offset-2 hover:text-primary hover:underline"
                    >
                      Use this template&apos;s suggested section order
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-label">Accent colour</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENTS.map((c) => (
                      <button key={c} type="button" onClick={() => setStyle({ accent: c })} className={`h-7 w-7 rounded-full border-2 ${style.accent === c ? "border-primary" : "border-transparent"}`} style={{ background: c }} aria-label={`Accent ${c}`} />
                    ))}
                    <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-border" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} title="Custom colour">
                      <input type="color" value={style.accent} onChange={(e) => setStyle({ accent: e.target.value })} className="absolute inset-0 opacity-0" aria-label="Custom accent" />
                    </label>
                  </div>
                  <p className="text-[11px] text-muted">Keep it dark — light colours print faintly and some ATS previews ignore colour anyway.</p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-label">Font</span>
                  <select value={style.font} onChange={(e) => setStyle({ font: e.target.value })} className={inputClass}>
                    {RESUME_FONTS.map((f) => (
                      <option key={f.name} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Range label="Text size" value={style.fontSize} min={8.5} max={12.5} step={0.5} onChange={(v) => setStyle({ fontSize: v })} format={(v) => `${v}pt`} />
                  <Range label="Line spacing" value={style.lineHeight} min={1.05} max={1.7} step={0.05} onChange={(v) => setStyle({ lineHeight: v })} format={(v) => v.toFixed(2)} />
                  <Range label="Page margins" value={style.margin} min={0.3} max={1.1} step={0.05} onChange={(v) => setStyle({ margin: v })} format={(v) => `${v.toFixed(2)}in`} />
                  <Range label="Section spacing" value={style.sectionSpacing ?? 1} min={0.4} max={2} step={0.1} onChange={(v) => setStyle({ sectionSpacing: v })} format={(v) => `${v.toFixed(1)}×`} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-label">Paper</span>
                  <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                    {[["a4", "A4"], ["letter", "US Letter"]].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setStyle({ pageSize: v })} className={`rounded-md px-3 py-1.5 ${style.pageSize === v ? "bg-background font-medium shadow-sm" : "text-muted"}`}>{l}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-label">Show</h3>
                  {[
                    ["projectTech", "Tech stack on projects"],
                    ["projectLinks", "Live / code links on projects"],
                    ["experienceTech", "Tech stack on experience"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-small">
                      {label}
                      <Toggle checked={Boolean(config.options?.[key])} onChange={(v) => setOption({ [key]: v })} label={label} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 text-small">
                    Dates
                    <select value={config.options?.dateStyle || "short"} onChange={(e) => setOption({ dateStyle: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                      <option value="short">Jan 2025</option>
                      <option value="long">January 2025</option>
                      <option value="numeric">01/2025</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-small">
                    Skills layout
                    <select value={config.options?.skillsLayout || "auto"} onChange={(e) => setOption({ skillsLayout: e.target.value })} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                      <option value="auto">Template default</option>
                      <option value="categories">By category</option>
                      <option value="grid">Two columns</option>
                      <option value="inline">One line</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === "share" && (
              <div className="space-y-5">
                <label className="block space-y-1.5">
                  <span className="text-label">Resume name (only you see this)</span>
                  <input className={inputClass} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value.slice(0, 80) }))} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-label">Share link</span>
                  <div className="flex items-center overflow-hidden rounded-xl border border-border bg-surface focus-within:border-primary">
                    <span className="pl-3 text-xs text-muted">/resume/</span>
                    <input className="min-w-0 flex-1 bg-transparent px-1 py-2 text-small outline-none" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60) }))} aria-label="Share link" />
                  </div>
                </label>

                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-small">
                      <span className="flex items-center gap-1.5 font-medium">{draft.isPublic ? <Globe size={14} /> : <Lock size={14} />} Public</span>
                      <span className="text-xs text-muted">Anyone with the link can view and download it</span>
                    </span>
                    <Toggle checked={draft.isPublic} onChange={(v) => setDraft((d) => ({ ...d, isPublic: v }))} label="Public" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-small">
                      <span className="flex items-center gap-1.5 font-medium"><Star size={14} /> Default resume</span>
                      <span className="text-xs text-muted">Also opens at {SITE_URL.replace(/^https?:\/\//, "")}/resume</span>
                    </span>
                    <Toggle checked={draft.isDefault} onChange={(v) => setDraft((d) => ({ ...d, isDefault: v }))} label="Default resume" />
                  </div>
                  {draft.isPublic && (show.phone || show.email) && <p className="text-[11px] text-amber-600 dark:text-amber-400">The public page shows the contact details switched on under Header.</p>}
                </div>

                {saved.isPublic ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                      <Link2 size={14} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">{shortUrl}</span>
                      <button type="button" onClick={() => navigator.clipboard.writeText(shortUrl).then(() => toast.success("Link copied"))} className="rounded-lg p-1.5 hover:bg-background" aria-label="Copy link">
                        <Copy size={14} />
                      </button>
                      <a href={shortUrl} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 hover:bg-background" aria-label="Open">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border border-border bg-white p-3">
                        <svg ref={qrRef} viewBox="0 0 256 256" width="112" height="112">
                          <QRCode value={`${shortUrl}?utm_source=qr&utm_medium=qr&utm_campaign=resume`} size={256} level="M" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <button type="button" onClick={share} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface">
                          <Share2 size={13} /> Share…
                        </button>
                        <button type="button" onClick={downloadQr} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface">
                          <QrIcon size={13} /> Download QR
                        </button>
                        <p className="text-[11px] text-muted">{resumes.find((r) => r.id === activeId)?.views || 0} views</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Turn on Public and save to get a link, QR code and share button.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className={`lg:sticky lg:top-0 lg:self-start ${mobileView === "edit" ? "hidden lg:block" : ""}`}>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              Live preview · {pages} page{pages === 1 ? "" : "s"}
              {pages > 1 && " · red lines mark page breaks"}
            </span>
            <span>{style.pageSize === "letter" ? "US Letter" : "A4"}</span>
          </div>
          <div className="max-h-[calc(100vh-11rem)] overflow-y-auto rounded-2xl border border-border bg-surface/60 p-3 sm:p-5 admin-scroll">
            <ScaledSheet config={config} data={source} onPages={setPages} />
          </div>
        </div>
      </div>

      <ResumePrintPortal config={config} data={source} siteUrl={SITE_URL} />

      <ConfirmModal isOpen={confirmDelete} title="Delete this resume?" message={`“${draft.name}” and its share link will be removed. Your portfolio content isn't affected.`} confirmText="Delete" onConfirm={remove} onCancel={() => setConfirmDelete(false)} loading={busy} />
    </div>
  );
}

export default ResumeBuilder;
