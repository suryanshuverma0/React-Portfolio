import { useEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft, Eye, EyeOff, FolderGit2, GripVertical, ImagePlus, Link2, Loader2, Pencil, Plus, Save, Search, Sparkles,
  Star, Trash2, Wand2, X, ExternalLink, Download, Globe, Check, Camera,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import api from "../../lib/axios";
import ProjectCard from "../../components/sections/Projects/ProjectCard";
import { projectsContent } from "../../components/content/projectsContent";
import { screenshotUrl, useReadyImage } from "../../components/sections/Products/productMedia";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";
import { uploadImage, uploadImages } from "../services/upload.service";
import { draftInBrowser, listReposInBrowser } from "../lib/githubDraft";

// GitHub calls run in the admin's browser first (own anonymous quota);
// the server is the fallback (it can hold a GITHUB_TOKEN).
const withFallback = async (browser, server) => {
  try {
    return await browser();
  } catch (error) {
    try {
      return await server();
    } catch {
      throw error;
    }
  }
};
const githubRepos = () => withFallback(listReposInBrowser, async () => data(await api.get("/projects/github/repos")));
const githubDraft = (repo) => withFallback(() => draftInBrowser(repo), async () => data(await api.post("/projects/github/import", { repo })));

/* ========================================
   PROJECTS — start from a GitHub repo (the
   README fills in the summary, stack,
   features, challenges and results), a live
   link, or a blank card; then polish it in
   four short steps with a live preview.
   Drag to reorder, star to feature.
========================================= */

const CATEGORIES = ["Full Stack", "Frontend", "Backend", "Blockchain", "Artificial Intelligence", "Mobile", "DevOps", "Software Engineering", "UI/UX", "Other"];
const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "media", label: "Media" },
  { id: "story", label: "Story" },
  { id: "results", label: "Results" },
];

const EMPTY = {
  title: "",
  slug: "",
  category: "Full Stack",
  description: "",
  githubUrl: "",
  liveUrl: "",
  thumbnail: null,
  gallery: [],
  architectureImages: [],
  technologies: [],
  features: [],
  challenges: [],
  learnings: [],
  evaluation: [],
  featured: false,
  isVisible: true,
};

const data = (r) => r.data.data;
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
const urlOf = (img) => img?.url || (typeof img === "string" ? img : "");
const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-small outline-none transition focus:border-primary";
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

/* ---------- list editor: one item per line ---------- */

function LinesInput({ label, hint, value, onChange, placeholder }) {
  return (
    <Field label={`${label}${value.length ? ` · ${value.length}` : ""}`} hint={hint || "One per line"}>
      <textarea
        rows={Math.min(10, Math.max(3, value.length + 1))}
        className={`${field} resize-y leading-relaxed`}
        value={value.join("\n")}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.split("\n").slice(0, 50))}
      />
    </Field>
  );
}

/* ---------- images ---------- */

function ImageGrid({ label, images, onChange, cover, onCover, folder = "projects" }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");

  const add = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const part of chunk(Array.from(files), 10)) uploaded.push(...(await uploadImages(part, folder)));
      onChange([...images, ...uploaded]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https:\/\//i.test(url)) return toast.error("Use an https:// image link");
    onChange([...images, { publicId: "", url }]);
    setLink("");
  };

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-secondary">
        {label} {images.length > 0 && <span className="text-muted">· {images.length}</span>}
      </p>
      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
        }}
      >
        {images.map((img, i) => (
          <div key={`${urlOf(img)}-${i}`} className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-surface">
            <img src={urlOf(img)} alt="" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-x-1 top-1 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              {onCover && (
                <button type="button" title="Use as cover" onClick={() => onCover(img)} className={`flex h-6 w-6 items-center justify-center rounded-full ${urlOf(cover) === urlOf(img) ? "bg-primary text-background" : "bg-black/60 text-white"}`}>
                  <Star size={11} />
                </button>
              )}
              <button type="button" title="Remove" onClick={() => onChange(images.filter((_, j) => j !== i))} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-[11px] text-muted hover:text-primary">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {busy ? "Uploading…" : "Add / drop"}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      <div className="flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())} placeholder="…or paste an image link" className={`${field} py-2 text-xs`} />
        <button type="button" onClick={addLink} disabled={!link.trim()} className="rounded-xl border border-border px-3 text-xs disabled:opacity-40">Add</button>
      </div>
    </div>
  );
}

function CoverPicker({ p, set, socialCard }) {
  const [busy, setBusy] = useState(false);
  const coverSrc = useReadyImage(urlOf(p.thumbnail));
  const fileRef = useRef(null);
  const options = [
    p.liveUrl && { id: "shot", label: "Live site", icon: Globe, url: screenshotUrl(p.liveUrl) },
    socialCard && { id: "gh", label: "GitHub card", icon: FaGithub, url: socialCard },
  ].filter(Boolean);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      set({ thumbnail: await uploadImage(file, "projects") });
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-secondary">Cover image</p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-muted">
              {urlOf(p.thumbnail) ? <><Loader2 size={14} className="animate-spin" /> Rendering…</> : "No cover yet"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap content-start gap-2 sm:w-40 sm:flex-col">
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Upload
          </button>
          {options.map(({ id, label, icon: Icon, url }) => (
            <button key={id} type="button" onClick={() => set({ thumbnail: { publicId: "", url } })} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${urlOf(p.thumbnail) === url ? "border-primary" : "border-border hover:border-primary"}`}>
              <Icon size={14} /> {label} {urlOf(p.thumbnail) === url && <Check size={12} />}
            </button>
          ))}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      <p className="text-[11px] text-muted">Or star any gallery image below to use it as the cover.</p>
    </div>
  );
}

/* ---------- editor ---------- */

function Editor({ initial, existingSlugs, onClose, onSaved }) {
  const [p, setP] = useState(initial);
  const [step, setStep] = useState("basics");
  const [saving, setSaving] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const socialCard = initial.meta?.socialCard || (p.githubUrl.match(/github\.com\/([^/]+\/[^/?#]+)/i) ? `https://opengraph.githubassets.com/portfolio/${p.githubUrl.match(/github\.com\/([^/]+\/[^/?#]+)/i)[1]}` : "");

  const preview = useMemo(
    () => ({ ...p, slug: p.slug || "preview", title: p.title || "Untitled project", thumbnail: urlOf(p.thumbnail), technologies: p.technologies }),
    [p],
  );

  const problems = [
    !p.title.trim() && "a title",
    p.description.trim().length < 10 && "a description (10+ characters)",
    !urlOf(p.thumbnail) && "a cover image",
  ].filter(Boolean);

  const save = async () => {
    if (problems.length) {
      toast.error(`Add ${problems.join(", ")}`);
      setStep(!urlOf(p.thumbnail) && p.title && p.description.length >= 10 ? "media" : "basics");
      return;
    }
    const slug = slugify(p.slug || p.title);
    if (!p._id && existingSlugs.includes(slug)) return toast.error("Another project already uses this link name — change the slug");
    const clean = (list) => list.map((s) => s.trim()).filter(Boolean);
    const img = (x) => ({ publicId: x.publicId || "", url: urlOf(x) });
    const body = {
      title: p.title.trim(),
      slug,
      category: p.category,
      description: p.description.trim(),
      githubUrl: p.githubUrl.trim(),
      liveUrl: p.liveUrl.trim(),
      thumbnail: img(p.thumbnail),
      gallery: p.gallery.map(img),
      architectureImages: p.architectureImages.map(img),
      technologies: clean(p.technologies),
      features: clean(p.features),
      challenges: clean(p.challenges),
      learnings: clean(p.learnings),
      evaluation: p.evaluation.filter((e) => e.label?.trim() && e.value?.trim()).map((e) => ({ label: e.label.trim(), value: e.value.trim() })),
      featured: p.featured,
      isVisible: p.isVisible,
    };
    setSaving(true);
    try {
      if (p._id) await api.put(`/projects/${p._id}`, body);
      else await api.post("/projects", body);
      toast.success(p._id ? "Project updated" : "Project published");
      onSaved();
    } catch (e) {
      const err = e.response?.data?.errors?.[0];
      toast.error(err ? `${err.field}: ${err.message}` : e.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-small text-muted hover:text-primary">
          <ArrowLeft size={16} /> All projects
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => set({ featured: !p.featured })} className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs ${p.featured ? "border-primary text-primary" : "border-border text-muted"}`}>
            <Star size={14} className={p.featured ? "fill-current" : ""} /> Featured
          </button>
          <button type="button" onClick={() => set({ isVisible: !p.isVisible })} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-muted">
            {p.isVisible ? <Eye size={14} /> : <EyeOff size={14} />} {p.isVisible ? "Visible" : "Hidden"}
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-small font-medium text-background disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {p._id ? "Save" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
            {STEPS.map((s, i) => (
              <button key={s.id} type="button" onClick={() => setStep(s.id)} className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs ${step === s.id ? "bg-background font-medium shadow-sm" : "text-muted hover:text-primary"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i < stepIndex ? "bg-primary text-background" : "border border-border"}`}>{i < stepIndex ? <Check size={11} /> : i + 1}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <section className="card space-y-4">
            {step === "basics" && (
              <>
                <Field label="Title">
                  <input className={field} value={p.title} onChange={(e) => set({ title: e.target.value, ...(!p._id ? { slug: slugify(e.target.value) } : {}) })} placeholder="What is it?" autoFocus />
                </Field>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-secondary">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" onClick={() => set({ category: c })} className={`rounded-full border px-3 py-1 text-xs transition ${p.category === c ? "border-primary bg-primary text-background" : "border-border text-secondary hover:border-primary"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Summary" hint={`${p.description.length}/5000 — the first lines show on the card; the full text on the case-study page`}>
                  <textarea rows={6} className={`${field} resize-y leading-relaxed`} value={p.description} onChange={(e) => set({ description: e.target.value.slice(0, 5000) })} />
                </Field>
                <TechnologyInput technologies={p.technologies} setTechnologies={(technologies) => set({ technologies })} label="Tech stack" placeholder="React" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="GitHub">
                    <input className={field} value={p.githubUrl} onChange={(e) => set({ githubUrl: e.target.value })} placeholder="https://github.com/…" />
                  </Field>
                  <Field label="Live demo">
                    <input className={field} value={p.liveUrl} onChange={(e) => set({ liveUrl: e.target.value })} placeholder="https://…" />
                  </Field>
                </div>
                <Field label="Link name (slug)" hint={`Case study at /projects/${slugify(p.slug || p.title) || "…"}`}>
                  <input className={field} value={p.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
                </Field>
              </>
            )}

            {step === "media" && (
              <>
                <CoverPicker p={p} set={set} socialCard={socialCard} />
                <ImageGrid label="Gallery — screenshots shown on the case study" images={p.gallery} onChange={(gallery) => set({ gallery })} cover={p.thumbnail} onCover={(img) => set({ thumbnail: img })} />
                <ImageGrid label="Architecture diagrams" images={p.architectureImages} onChange={(architectureImages) => set({ architectureImages })} cover={p.thumbnail} onCover={(img) => set({ thumbnail: img })} />
              </>
            )}

            {step === "story" && (
              <>
                <LinesInput label="Key features" value={p.features} onChange={(features) => set({ features })} placeholder={"QR-based product verification\nRole-based dashboards"} />
                <LinesInput label="Challenges" value={p.challenges} onChange={(challenges) => set({ challenges })} placeholder="What was hard, and how you solved it" />
                <LinesInput label="What I learned" value={p.learnings} onChange={(learnings) => set({ learnings })} />
              </>
            )}

            {step === "results" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-secondary">Results & metrics</p>
                {p.evaluation.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={`${field} min-w-0 flex-1`} value={e.label} placeholder="Accuracy" onChange={(ev) => set({ evaluation: p.evaluation.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)) })} />
                    <input className={`${field} w-28! shrink-0 sm:w-36!`} value={e.value} placeholder="95.3%" onChange={(ev) => set({ evaluation: p.evaluation.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)) })} />
                    <button type="button" onClick={() => set({ evaluation: p.evaluation.filter((_, j) => j !== i) })} className="px-1 text-muted hover:text-red-500" aria-label="Remove">
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set({ evaluation: [...p.evaluation, { label: "", value: "" }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
                  <Plus size={13} /> Add a metric
                </button>
                <p className="pt-2 text-[11px] text-muted">Numbers people can check — accuracy, gas cost, latency, users, uptime.</p>
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-4">
              <button type="button" disabled={stepIndex === 0} onClick={() => setStep(STEPS[stepIndex - 1].id)} className="rounded-xl px-3 py-2 text-xs text-muted hover:text-primary disabled:opacity-0">
                ← Back
              </button>
              {stepIndex < STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep(STEPS[stepIndex + 1].id)} className="rounded-xl border border-border px-4 py-2 text-xs hover:border-primary">
                  Next: {STEPS[stepIndex + 1].label} →
                </button>
              ) : (
                <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-background">
                  {p._id ? "Save changes" : "Publish project"}
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-2 xl:sticky xl:top-0 xl:self-start">
          <p className="text-xs text-muted">Live preview — as on the portfolio{problems.length ? ` · still needs ${problems.join(", ")}` : ""}</p>
          <div className="pointer-events-none">
            <ProjectCard project={preview} index={0} lead={p.featured} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- GitHub picker ---------- */

function GitHubPicker({ importedUrls, onPick, onClose }) {
  const [state, setState] = useState({ loading: true, repos: [], username: "" });
  const [q, setQ] = useState("");
  const [showForks, setShowForks] = useState(false);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let cancelled = false;
    githubRepos()
      .then((result) => !cancelled && setState({ loading: false, ...result }))
      .catch((e) => {
        if (cancelled) return;
        toast.error(e.response?.data?.message || "Couldn't reach GitHub");
        setState({ loading: false, repos: [], username: "", failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const repos = state.repos.filter((r) => (showForks || !r.fork) && `${r.name} ${r.description} ${r.language} ${r.topics.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const pick = async (repo) => {
    setBusy(repo.fullName);
    try {
      await onPick(repo.url);
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="card space-y-4">
      <div className="flex items-center gap-3">
        <FaGithub size={20} />
        <div className="min-w-0 flex-1">
          <h2 className="text-title">Import from GitHub</h2>
          <p className="text-xs text-muted">{state.username ? `@${state.username} · pick a repo — the README fills in the rest` : state.failed ? "GitHub isn't answering right now — you can still paste a repo link" : "Loading your repositories…"}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter repositories" className="h-10 min-w-0 flex-1 bg-transparent text-small outline-none" />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={showForks} onChange={(e) => setShowForks(e.target.checked)} /> Show forks
        </label>
      </div>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {state.loading && [0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface" />)}
        {!state.loading && !state.failed && !repos.length && <p className="py-6 text-center text-small text-muted">No repositories match.</p>}
        {repos.map((r) => {
          const imported = importedUrls.has(r.url.toLowerCase());
          return (
            <button key={r.fullName} type="button" disabled={Boolean(busy)} onClick={() => pick(r)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary disabled:opacity-60">
              <FolderGit2 size={18} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-small font-medium">
                  <span className="truncate">{r.name}</span>
                  {imported && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">On portfolio</span>}
                  {r.homepage && <Globe size={12} className="shrink-0 text-muted" />}
                </p>
                <p className="truncate text-xs text-muted">{r.description || "No description"}</p>
              </div>
              <span className="hidden shrink-0 text-right text-[11px] text-muted sm:block">
                {r.language}
                {r.stars > 0 && <span className="ml-2">★ {r.stars}</span>}
                <span className="block">{new Date(r.pushedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
              </span>
              {busy === r.fullName ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={15} className="shrink-0 text-muted" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- list row ---------- */

function Row({ project, onEdit, onToggle, onFeature, onDelete }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={project} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.01, zIndex: 10 }}>
      <div className={`flex items-center gap-3 rounded-2xl border bg-card p-2.5 pr-3 ${project.isVisible ? "border-border" : "border-dashed border-border opacity-60"}`}>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Drag to reorder">
          <GripVertical size={17} />
        </button>
        <img src={urlOf(project.thumbnail)} alt="" loading="lazy" className="hidden aspect-video w-24 shrink-0 rounded-lg border border-border object-cover object-top sm:block" />
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className="truncate text-small font-medium">{project.title}</p>
          <p className="truncate text-xs text-muted">
            {project.category} · {(project.technologies || []).slice(0, 4).join(", ")}
          </p>
        </button>
        <button type="button" onClick={onFeature} className={`rounded-lg p-2 hover:bg-surface ${project.featured ? "text-primary" : "text-muted"}`} aria-label={project.featured ? "Unfeature" : "Feature"} title="Featured">
          <Star size={16} className={project.featured ? "fill-current" : ""} />
        </button>
        <button type="button" onClick={onToggle} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" aria-label={project.isVisible ? "Hide" : "Show"} title={project.isVisible ? "Visible" : "Hidden"}>
          {project.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <a href={`/projects/${project.slug}`} target="_blank" rel="noreferrer" className="hidden rounded-lg p-2 text-muted hover:bg-surface hover:text-primary sm:block" aria-label="Open case study">
          <ExternalLink size={16} />
        </a>
        <button type="button" onClick={onEdit} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" aria-label="Edit">
          <Pencil size={16} />
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-red-500" aria-label="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </Reorder.Item>
  );
}

/* ---------- built-in import ---------- */

const fileFromAsset = async (src, name) => {
  const blob = await (await fetch(src)).blob();
  return new File([blob], name, { type: blob.type || "image/png" });
};

// Created hidden and revealed together at the end, so the public site keeps
// its built-in list until every project (and image) is safely in.
async function importBuiltIn(existing, onProgress) {
  const existingSlugs = existing.map((p) => p.slug);
  const todo = projectsContent.filter((p) => !existingSlugs.includes(p.slug));
  const created = [];
  let done = 0;
  for (const [order, p] of todo.entries()) {
    onProgress(`Uploading images for “${p.title.slice(0, 40)}…” (${done + 1}/${todo.length})`);
    const uploadAll = async (list = []) => {
      const files = await Promise.all(list.map((src, i) => fileFromAsset(src, `${p.slug}-${i}.png`)));
      const out = [];
      for (const part of chunk(files, 10)) out.push(...(await uploadImages(part, "projects")));
      return out;
    };
    const [thumbnail] = await uploadAll([p.thumbnail]);
    const gallery = await uploadAll(p.gallery);
    const architectureImages = await uploadAll(p.architectureImages);
    const saved = await api.post("/projects", {
      title: p.title,
      slug: p.slug,
      category: p.category,
      description: p.description,
      githubUrl: p.githubUrl || "",
      liveUrl: p.liveUrl || "",
      thumbnail,
      gallery,
      architectureImages,
      technologies: p.technologies || [],
      features: p.features || [],
      challenges: p.challenges || [],
      learnings: p.learnings || [],
      evaluation: p.evaluation || [],
      featured: Boolean(p.featured),
      isVisible: false,
      order: existingSlugs.length + order,
    });
    created.push(data(saved)._id);
    done += 1;
  }
  // Reveal this run's projects plus any left hidden by an interrupted run.
  const builtInSlugs = new Set(projectsContent.map((p) => p.slug));
  const reveal = [...created, ...existing.filter((p) => builtInSlugs.has(p.slug) && !p.isVisible).map((p) => p._id)];
  onProgress("Publishing…");
  await Promise.all(reveal.map((id) => api.put(`/projects/${id}`, { isVisible: true })));
  return done;
}

/* ---------- page ---------- */

function Projects() {
  const [projects, setProjects] = useState(null);
  const [editing, setEditing] = useState(null);
  const [picker, setPicker] = useState(false);
  const [link, setLink] = useState("");
  const [fetching, setFetching] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [importing, setImporting] = useState("");

  const load = () =>
    api
      .get("/projects")
      .then((r) => setProjects(data(r)))
      .catch(() => toast.error("Couldn't load projects"));

  useEffect(() => {
    load();
  }, []);

  const slugs = useMemo(() => (projects || []).map((p) => p.slug), [projects]);
  const importedUrls = useMemo(() => new Set((projects || []).map((p) => (p.githubUrl || "").toLowerCase()).filter(Boolean)), [projects]);

  const fromGitHub = async (repoUrl) => {
    const draft = await githubDraft(repoUrl);
    let slug = draft.slug;
    for (let n = 2; slugs.includes(slug); n += 1) slug = `${draft.slug}-${n}`;
    setEditing({ ...EMPTY, ...draft, slug });
    setPicker(false);
    toast.success("Draft filled in from the README — review and publish");
  };

  const quickStart = async (e) => {
    e.preventDefault();
    let url = link.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setFetching(true);
    try {
      if (/github\.com\/[^/]+\/[^/?#]+/i.test(url)) await fromGitHub(url);
      else setEditing({ ...EMPTY, liveUrl: url, thumbnail: { publicId: "", url: screenshotUrl(url) } });
      setLink("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't read that link");
    } finally {
      setFetching(false);
    }
  };

  const patch = async (project, change) => {
    setProjects((list) => list.map((p) => (p._id === project._id ? { ...p, ...change } : p)));
    await api.put(`/projects/${project._id}`, change).catch(() => {
      toast.error("Couldn't save");
      load();
    });
  };

  const reorder = (next) => {
    setProjects(next);
    api.put("/projects/reorder", { ids: next.map((p) => p._id) }).catch(() => toast.error("Couldn't save the order"));
  };

  const runImport = async () => {
    try {
      const n = await importBuiltIn(projects || [], setImporting);
      toast.success(`Imported ${n} project${n === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Import stopped — run it again to continue");
    } finally {
      setImporting("");
      load();
    }
  };

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Editor
          initial={editing}
          existingSlugs={slugs.filter((s) => s !== editing.slug || !editing._id)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      </div>
    );
  }

  const missingBuiltIns = projectsContent.filter((p) => !slugs.includes(p.slug)).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <FolderGit2 size={28} /> Projects
        </h1>
        <p className="text-body mt-2">Case studies on your portfolio. Start from a repo and the README does most of the writing.</p>
      </section>

      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <button type="button" onClick={() => setPicker((x) => !x)} className="card flex items-center gap-4 text-left transition hover:border-primary">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-background">
            <FaGithub size={22} />
          </span>
          <span>
            <span className="block text-small font-semibold">Import from GitHub</span>
            <span className="text-xs text-muted">Pick a repo — summary, stack, features, challenges, metrics and screenshots fill in.</span>
          </span>
        </button>
        <form onSubmit={quickStart} className="card flex flex-col justify-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-primary">
            <Link2 size={15} className="shrink-0 text-muted" />
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a repo or live link" className="h-10 min-w-0 flex-1 bg-transparent text-small outline-none" aria-label="Project link" />
            <button type="submit" disabled={fetching || !link.trim()} className="text-muted hover:text-primary disabled:opacity-40" aria-label="Start from link">
              {fetching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </label>
          <button type="button" onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-1.5 self-start text-xs text-muted hover:text-primary">
            <Plus size={13} /> or start from a blank card
          </button>
        </form>
      </div>

      {picker && <GitHubPicker importedUrls={importedUrls} onPick={(url) => fromGitHub(url).catch((e) => toast.error(e.response?.data?.message || "Import failed"))} onClose={() => setPicker(false)} />}

      {projects && missingBuiltIns > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4 sm:flex-row sm:items-center">
          <Camera size={18} className="shrink-0 text-muted" />
          <p className="flex-1 text-small text-secondary">
            {projects.length
              ? `${missingBuiltIns} of the built-in projects aren't in your list yet.`
              : `Your portfolio is showing ${projectsContent.length} built-in projects. Bring them in here to edit, reorder or hide them — the site will look the same.`}
            {importing && <span className="mt-1 block text-xs text-muted">{importing}</span>}
          </p>
          <button type="button" onClick={runImport} disabled={Boolean(importing)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-medium hover:border-primary disabled:opacity-50">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Import built-in projects
          </button>
        </section>
      )}

      {!projects ? (
        <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)}</div>
      ) : projects.length ? (
        <>
          <p className="text-xs text-muted">
            {projects.length} project{projects.length === 1 ? "" : "s"} · drag to reorder · the first featured one gets the wide card
          </p>
          <Reorder.Group axis="y" values={projects} onReorder={reorder} className="space-y-2.5">
            {projects.map((project) => (
              <Row
                key={project._id}
                project={project}
                onEdit={() => setEditing({ ...EMPTY, ...project, githubUrl: project.githubUrl || "", liveUrl: project.liveUrl || "" })}
                onToggle={() => patch(project, { isVisible: !project.isVisible })}
                onFeature={() => patch(project, { featured: !project.featured })}
                onDelete={() => setToDelete(project)}
              />
            ))}
          </Reorder.Group>
        </>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Delete this project?"
        message={`“${toDelete?.title || ""}” and its uploaded images will be removed.`}
        confirmText="Delete"
        onConfirm={async () => {
          await api.delete(`/projects/${toDelete._id}`).catch(() => toast.error("Couldn't delete"));
          setToDelete(null);
          load();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default Projects;
