import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "react-toastify";
import {
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Star,
  ArrowLeft,
  Save,
  Download,
  X,
  Loader2,
} from "lucide-react";

import api from "../../lib/axios";
import ResearchCard from "../../components/sections/Research/ResearchCard";
import { researchContent } from "../../components/content/researchContent";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";

/* ========================================
   RESEARCH — add and edit the papers shown
   in the portfolio's Research section (and
   the hero announcement). Every part of the
   card is editable, with a live preview of
   the real public card.
========================================= */

const data = (r) => r.data.data;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

const EMPTY = {
  title: "",
  slug: "",
  status: "Published",
  venue: "",
  paperId: "",
  schedule: "",
  authors: [{ name: "Suryanshu Verma", self: true }],
  summary: "",
  highlights: [],
  architectureTitle: "Architecture",
  architectureNote: "",
  contracts: [],
  contributions: [],
  metricsTitle: "Key measurements",
  metricsNote: "",
  gas: [],
  evaluationNotes: [],
  limitations: [],
  technologies: [],
  githubUrl: "",
  paperUrl: "",
  doiUrl: "",
  projectSlug: "",
  featured: false,
  isVisible: true,
};

const STATUSES = ["Published", "Accepted for oral presentation", "Accepted", "Under review", "Preprint", "In progress", "Presented"];

const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-small outline-none transition focus:border-primary";

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Block({ title, hint, children }) {
  return (
    <section className="card space-y-4">
      <div>
        <h3 className="text-title">{title}</h3>
        {hint && <p className="text-small mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// One item per line ↔ array.
function Lines({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      rows={rows}
      className={`${field} resize-y`}
      value={(value || []).join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      onBlur={() => onChange((value || []).map((v) => v.trim()).filter(Boolean))}
      placeholder={placeholder}
    />
  );
}

// Rows of { label, value } (or any two keys).
function Pairs({ rows, onChange, keys = ["value", "label"], placeholders = ["Value", "Label"], max = 12 }) {
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input className={`${field} w-36 shrink-0`} value={row[keys[0]] || ""} onChange={(e) => set(i, keys[0], e.target.value)} placeholder={placeholders[0]} />
          <input className={field} value={row[keys[1]] || ""} onChange={(e) => set(i, keys[1], e.target.value)} placeholder={placeholders[1]} />
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="rounded-lg px-2 text-muted hover:text-red-500" aria-label="Remove row">
            <X size={15} />
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => onChange([...rows, {}])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
          <Plus size={13} /> Add row
        </button>
      )}
    </div>
  );
}

function Editor({ initial, projects, onClose, onSaved }) {
  const [paper, setPaper] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial._id));
  const [saving, setSaving] = useState(false);
  const set = (patch) => setPaper((p) => ({ ...p, ...patch }));

  const save = async () => {
    if (!paper.title.trim()) return toast.error("Add a title");
    const slug = slugify(paper.slug || paper.title);
    if (slug.length < 2) return toast.error("Add a link name (slug)");
    setSaving(true);
    // Send only editable fields (server-managed ones like order stay put).
    const { _id } = paper;
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, paper[k] ?? EMPTY[k]]));
    try {
      const saved = _id ? data(await api.put(`/research/${_id}`, { ...body, slug })) : data(await api.post("/research", { ...body, slug }));
      toast.success("Paper saved — it's on your portfolio");
      onSaved(saved);
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] ? `${e.response.data.errors[0].field}: ${e.response.data.errors[0].message}` : e.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => ({ ...paper, id: paper.slug || "preview" }), [paper]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-small text-muted hover:text-primary">
          <ArrowLeft size={16} /> All papers
        </button>
        <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-small font-medium text-background disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save paper
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Block title="The paper">
            <Field label="Title">
              <textarea rows={2} className={`${field} resize-none`} value={paper.title} onChange={(e) => set({ title: e.target.value, ...(!slugTouched ? { slug: slugify(e.target.value) } : {}) })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <input list="research-statuses" className={field} value={paper.status} onChange={(e) => set({ status: e.target.value })} />
                <datalist id="research-statuses">
                  {STATUSES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Venue (conference / journal)">
                <input className={field} value={paper.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="ICTDsC 2026" />
              </Field>
              <Field label="Paper ID">
                <input className={field} value={paper.paperId} onChange={(e) => set({ paperId: e.target.value })} placeholder="162" />
              </Field>
              <Field label="Date / schedule line">
                <input className={field} value={paper.schedule} onChange={(e) => set({ schedule: e.target.value })} placeholder="Scheduled for Nov 19–20, 2026" />
              </Field>
            </div>
            <Field label="Link name (slug)" hint="Used as the paper's id on the site">
              <input className={field} value={paper.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} />
            </Field>
            <div className="flex flex-wrap gap-5 text-small">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={paper.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-current" /> Featured in the hero
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={paper.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} className="h-4 w-4 accent-current" /> Visible on the portfolio
              </label>
            </div>
          </Block>

          <Block title="Authors" hint="Tick yourself so your name is highlighted">
            <div className="space-y-2">
              {paper.authors.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={field} value={a.name} onChange={(e) => set({ authors: paper.authors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="Author name" />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={Boolean(a.self)} onChange={(e) => set({ authors: paper.authors.map((x, j) => (j === i ? { ...x, self: e.target.checked } : x)) })} className="accent-current" /> Me
                  </label>
                  <button type="button" onClick={() => set({ authors: paper.authors.filter((_, j) => j !== i) })} className="px-1 text-muted hover:text-red-500" aria-label="Remove author">
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set({ authors: [...paper.authors, { name: "" }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
                <Plus size={13} /> Add author
              </button>
            </div>
          </Block>

          <Block title="Abstract">
            <textarea rows={6} className={`${field} resize-y`} value={paper.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="What problem, what approach, what result — 3–5 sentences." />
          </Block>

          <Block title="Headline results" hint="Big numbers, grouped by where they were measured">
            {paper.highlights.map((group, gi) => (
              <div key={gi} className="space-y-2 rounded-2xl border border-border p-3">
                <div className="flex gap-2">
                  <input className={field} value={group.environment} onChange={(e) => set({ highlights: paper.highlights.map((g, j) => (j === gi ? { ...g, environment: e.target.value } : g)) })} placeholder="e.g. Public testnet · Ethereum Sepolia" />
                  <button type="button" onClick={() => set({ highlights: paper.highlights.filter((_, j) => j !== gi) })} className="px-1 text-muted hover:text-red-500" aria-label="Remove group">
                    <Trash2 size={15} />
                  </button>
                </div>
                <Pairs rows={group.results} onChange={(results) => set({ highlights: paper.highlights.map((g, j) => (j === gi ? { ...g, results } : g)) })} placeholders={["50 / 50", "What it measures"]} max={8} />
              </div>
            ))}
            <button type="button" onClick={() => set({ highlights: [...paper.highlights, { environment: "", results: [{}] }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
              <Plus size={13} /> Add results group
            </button>
          </Block>

          <Block title="Architecture" hint="Components shown as a pipeline (leave empty to hide)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Heading">
                <input className={field} value={paper.architectureTitle} onChange={(e) => set({ architectureTitle: e.target.value })} />
              </Field>
              <Field label="Note">
                <input className={field} value={paper.architectureNote} onChange={(e) => set({ architectureNote: e.target.value })} placeholder="3 contracts" />
              </Field>
            </div>
            <Pairs rows={paper.contracts} keys={["name", "description"]} placeholders={["Name", "What it does"]} onChange={(contracts) => set({ contracts })} max={10} />
          </Block>

          <Block title="Measurements" hint="Shown as a bar chart (numbers can include commas)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Heading">
                <input className={field} value={paper.metricsTitle} onChange={(e) => set({ metricsTitle: e.target.value })} />
              </Field>
              <Field label="Note">
                <input className={field} value={paper.metricsNote} onChange={(e) => set({ metricsNote: e.target.value })} placeholder="Sepolia · 10 runs" />
              </Field>
            </div>
            <Pairs rows={paper.gas} keys={["label", "value"]} placeholders={["What", "Value"]} onChange={(gas) => set({ gas })} max={15} />
          </Block>

          <Block title="Details" hint="One item per line">
            <Field label="Contributions">
              <Lines value={paper.contributions} onChange={(contributions) => set({ contributions })} placeholder="What's new in this work…" />
            </Field>
            <Field label="Evaluation notes">
              <Lines value={paper.evaluationNotes} onChange={(evaluationNotes) => set({ evaluationNotes })} rows={3} />
            </Field>
            <Field label="Scope & limitations">
              <Lines value={paper.limitations} onChange={(limitations) => set({ limitations })} rows={3} />
            </Field>
            <TechnologyInput technologies={paper.technologies} setTechnologies={(technologies) => set({ technologies })} label="Stack" placeholder="Solidity" />
          </Block>

          <Block title="Links">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Paper (PDF or publisher page)">
                <input className={field} value={paper.paperUrl} onChange={(e) => set({ paperUrl: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="DOI link">
                <input className={field} value={paper.doiUrl} onChange={(e) => set({ doiUrl: e.target.value })} placeholder="https://doi.org/…" />
              </Field>
              <Field label="Code (GitHub)">
                <input className={field} value={paper.githubUrl} onChange={(e) => set({ githubUrl: e.target.value })} placeholder="https://github.com/…" />
              </Field>
              <Field label="Related project">
                <select className={field} value={paper.projectSlug} onChange={(e) => set({ projectSlug: e.target.value })}>
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Block>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <p className="mb-2 text-xs text-muted">Live preview — exactly as on the portfolio</p>
          <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-3xl admin-scroll">
            <ResearchCard paper={preview} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ paper, onEdit, onToggle, onDelete }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={paper} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.01, zIndex: 10 }}>
      <div className={`flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 ${paper.isVisible ? "border-border" : "border-dashed border-border opacity-60"}`}>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Drag to reorder">
          <GripVertical size={17} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-small font-medium">
            {paper.featured && <Star size={13} className="shrink-0 fill-current text-[var(--color-chart-4)]" />}
            <span className="truncate">{paper.title}</span>
          </p>
          <p className="truncate text-xs text-muted">{[paper.status, paper.venue].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={onToggle} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" aria-label={paper.isVisible ? "Hide" : "Show"} title={paper.isVisible ? "Visible — click to hide" : "Hidden — click to show"}>
          {paper.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
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

function ResearchAdmin() {
  const [papers, setPapers] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get("/research")
      .then((r) => setPapers(data(r)))
      .catch(() => toast.error("Couldn't load papers"));

  useEffect(() => {
    load();
    api.get("/projects").then((r) => setProjects(data(r) || [])).catch(() => {});
  }, []);

  const importBuiltIn = async () => {
    setBusy(true);
    try {
      for (const { id, ...paper } of researchContent) {
        await api.post("/research", { ...paper, slug: id, featured: true, isVisible: true });
      }
      toast.success("Imported — you can edit it now");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const reorder = (next) => {
    setPapers(next);
    api.put("/research/reorder", { ids: next.map((p) => p._id) }).catch(() => toast.error("Couldn't save the order"));
  };

  const toggle = async (paper) => {
    setPapers((list) => list.map((p) => (p._id === paper._id ? { ...p, isVisible: !p.isVisible } : p)));
    await api.put(`/research/${paper._id}`, { isVisible: !paper.isVisible }).catch(() => load());
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/research/${toDelete._id}`);
      setToDelete(null);
      load();
      toast.success("Paper deleted");
    } catch {
      toast.error("Couldn't delete");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Editor
          initial={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <FlaskConical size={28} /> Research
          </h1>
          <p className="text-body mt-2">Papers in your portfolio&apos;s Research section. The starred one is announced in the hero.</p>
        </div>
        <button type="button" onClick={() => setEditing({ ...EMPTY })} className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 font-medium text-background">
          <Plus size={17} /> Add paper
        </button>
      </section>

      {!papers ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface" />
          ))}
        </div>
      ) : papers.length ? (
        <>
          <Reorder.Group axis="y" values={papers} onReorder={reorder} className="space-y-2.5">
            {papers.map((paper) => (
              <Row key={paper._id} paper={paper} onEdit={() => setEditing({ ...EMPTY, ...paper })} onToggle={() => toggle(paper)} onDelete={() => setToDelete(paper)} />
            ))}
          </Reorder.Group>
          <p className="text-xs text-muted">Drag to set the order on the portfolio.</p>
        </>
      ) : (
        <div className="card space-y-4 py-10 text-center">
          <FlaskConical size={32} className="mx-auto text-muted" />
          <p className="text-title">No papers in the admin yet</p>
          <p className="text-small mx-auto max-w-md">Your portfolio is showing its built-in paper. Import it to edit it here, or add a new one.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={importBuiltIn} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-small font-medium text-background disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Import built-in paper
            </button>
            <button type="button" onClick={() => setEditing({ ...EMPTY })} className="inline-flex h-10 items-center gap-2 rounded-control border border-border px-5 text-small">
              <Plus size={15} /> Start from scratch
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Delete this paper?"
        message={`“${toDelete?.title || ""}” will be removed from your portfolio.`}
        confirmText="Delete"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
        loading={busy}
      />
    </div>
  );
}

export default ResearchAdmin;
