import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "react-toastify";
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Star, ArrowLeft, Save, Loader2, Wand2, Link2, X, Globe, Smartphone } from "lucide-react";

import api from "../../lib/axios";
import ProductCard from "../../components/sections/Products/ProductCard";
import TechnologyInput from "../components/form/TechnologyInput";
import ConfirmModal from "../components/ui/ConfirmModal";

/* ========================================
   PRODUCTS — paste a link (website, App
   Store or Play Store) and the details fill
   themselves in: name, tagline, icon, social
   image, colour; websites get a live
   homepage screenshot. Tweak and publish.
========================================= */

const data = (r) => r.data.data;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

const EMPTY = {
  name: "",
  slug: "",
  kind: "web",
  url: "",
  tagline: "",
  description: "",
  status: "Live",
  category: "",
  icon: "",
  image: "",
  screenshots: [],
  accent: "",
  links: { website: "", playStore: "", appStore: "", github: "" },
  stats: [],
  technologies: [],
  rating: null,
  launchedAt: "",
  useScreenshot: true,
  featured: false,
  isVisible: true,
};

const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-small outline-none transition focus:border-primary";

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Editor({ initial, onClose, onSaved }) {
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const setLink = (key, value) => setP((x) => ({ ...x, links: { ...x.links, [key]: value } }));

  const save = async () => {
    if (!p.name.trim()) return toast.error("Add a name");
    const slug = slugify(p.slug || p.name);
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] ?? EMPTY[k]]));
    body.slug = slug;
    body.stats = (body.stats || []).filter((s) => s.label && s.value);
    body.screenshots = (body.screenshots || []).filter(Boolean);
    setSaving(true);
    try {
      const saved = p._id ? data(await api.put(`/products/${p._id}`, body)) : data(await api.post("/products", body));
      toast.success("Product saved — it's on your portfolio");
      onSaved(saved);
    } catch (e) {
      const err = e.response?.data?.errors?.[0];
      toast.error(err ? `${err.field}: ${err.message}` : e.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-small text-muted hover:text-primary">
          <ArrowLeft size={16} /> All products
        </button>
        <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-small font-medium text-background disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save product
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="card space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input className={field} value={p.name} onChange={(e) => set({ name: e.target.value, ...(!p._id ? { slug: slugify(e.target.value) } : {}) })} />
              </Field>
              <Field label="Type">
                <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
                  {[
                    ["web", "Website", Globe],
                    ["mobile", "Mobile app", Smartphone],
                  ].map(([v, l, Icon]) => (
                    <button key={v} type="button" onClick={() => set({ kind: v })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs ${p.kind === v ? "bg-background font-medium shadow-sm" : "text-muted"}`}>
                      <Icon size={13} /> {l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Tagline" hint="One line under the name">
              <input className={field} value={p.tagline} onChange={(e) => set({ tagline: e.target.value.slice(0, 160) })} />
            </Field>
            <Field label="Description">
              <textarea rows={4} className={`${field} resize-y`} value={p.description} onChange={(e) => set({ description: e.target.value.slice(0, 2000) })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <input list="product-statuses" className={field} value={p.status} onChange={(e) => set({ status: e.target.value })} />
                <datalist id="product-statuses">
                  {["Live", "Beta", "Early access", "Coming soon", "Archived"].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Category">
                <input className={field} value={p.category} onChange={(e) => set({ category: e.target.value })} placeholder="SaaS, Tool…" />
              </Field>
              <Field label="Brand colour">
                <div className="flex items-center gap-2">
                  <input type="color" value={p.accent || "#111111"} onChange={(e) => set({ accent: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent" />
                  {p.accent && (
                    <button type="button" onClick={() => set({ accent: "" })} className="text-xs text-muted hover:text-primary">Clear</button>
                  )}
                </div>
              </Field>
            </div>
          </section>

          <section className="card space-y-4">
            <h3 className="text-title">Links</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Website">
                <input className={field} value={p.links?.website || ""} onChange={(e) => { setLink("website", e.target.value); set({ url: e.target.value }); }} placeholder="https://…" />
              </Field>
              <Field label="GitHub">
                <input className={field} value={p.links?.github || ""} onChange={(e) => setLink("github", e.target.value)} placeholder="https://github.com/…" />
              </Field>
              <Field label="Google Play">
                <input className={field} value={p.links?.playStore || ""} onChange={(e) => setLink("playStore", e.target.value)} placeholder="https://play.google.com/…" />
              </Field>
              <Field label="App Store">
                <input className={field} value={p.links?.appStore || ""} onChange={(e) => setLink("appStore", e.target.value)} placeholder="https://apps.apple.com/…" />
              </Field>
            </div>
          </section>

          <section className="card space-y-4">
            <h3 className="text-title">Visuals</h3>
            {p.kind === "web" && (
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-small">
                <input type="checkbox" checked={p.useScreenshot} onChange={(e) => set({ useScreenshot: e.target.checked })} className="mt-0.5 h-4 w-4 accent-current" />
                <span>
                  <span className="block font-medium">Live homepage screenshot</span>
                  <span className="text-xs text-muted">Taken automatically from the website (first load can take a few seconds). Off = use the image below.</span>
                </span>
              </label>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Icon / logo URL">
                <div className="flex items-center gap-2">
                  {p.icon && <img src={p.icon} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover" />}
                  <input className={field} value={p.icon} onChange={(e) => set({ icon: e.target.value })} />
                </div>
              </Field>
              <Field label="Cover image URL" hint="Social preview image — used when the screenshot is off">
                <input className={field} value={p.image} onChange={(e) => set({ image: e.target.value })} />
              </Field>
            </div>
            {p.kind === "mobile" && (
              <Field label="App screenshots (one URL per line)">
                <textarea rows={3} className={`${field} resize-y font-mono text-xs`} value={(p.screenshots || []).join("\n")} onChange={(e) => set({ screenshots: e.target.value.split("\n").slice(0, 10) })} />
              </Field>
            )}
          </section>

          <section className="card space-y-4">
            <h3 className="text-title">Highlights</h3>
            <div className="space-y-2">
              {(p.stats || []).map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${field} w-28 shrink-0`} value={s.value || ""} onChange={(e) => set({ stats: p.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder="10k+" />
                  <input className={field} value={s.label || ""} onChange={(e) => set({ stats: p.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="QR codes created" />
                  <button type="button" onClick={() => set({ stats: p.stats.filter((_, j) => j !== i) })} className="px-1 text-muted hover:text-red-500" aria-label="Remove">
                    <X size={15} />
                  </button>
                </div>
              ))}
              {(p.stats || []).length < 6 && (
                <button type="button" onClick={() => set({ stats: [...(p.stats || []), {}] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
                  <Plus size={13} /> Add a stat
                </button>
              )}
            </div>
            <TechnologyInput technologies={p.technologies || []} setTechnologies={(technologies) => set({ technologies })} label="Built with" placeholder="React" />
            <div className="flex flex-wrap gap-5 text-small">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={p.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-current" /> Featured
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={p.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} className="h-4 w-4 accent-current" /> Visible on the portfolio
              </label>
            </div>
          </section>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <p className="mb-2 text-xs text-muted">Live preview — as on the portfolio</p>
          <ProductCard key={`${p.url}-${p.useScreenshot}-${p.kind}`} product={p} />
        </div>
      </div>
    </div>
  );
}

function Row({ product, onEdit, onToggle, onDelete }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={product} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.01, zIndex: 10 }}>
      <div className={`flex items-center gap-3 rounded-2xl border bg-card p-3 ${product.isVisible ? "border-border" : "border-dashed border-border opacity-60"}`}>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Drag to reorder">
          <GripVertical size={17} />
        </button>
        {product.icon ? <img src={product.icon} alt="" className="h-10 w-10 rounded-xl border border-border object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface"><Package size={18} /></span>}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-small font-medium">
            {product.featured && <Star size={13} className="fill-current text-[var(--color-chart-4)]" />}
            <span className="truncate">{product.name}</span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">{product.kind === "mobile" ? "App" : "Web"}</span>
          </p>
          <p className="truncate text-xs text-muted">{product.tagline || product.url}</p>
        </div>
        <button type="button" onClick={onToggle} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" aria-label={product.isVisible ? "Hide" : "Show"}>
          {product.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
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

function ProductsAdmin() {
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => api.get("/products").then((r) => setProducts(data(r))).catch(() => toast.error("Couldn't load products"));

  useEffect(() => {
    load();
  }, []);

  const quickAdd = async (e) => {
    e.preventDefault();
    let link = url.trim();
    if (!link) return;
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
    setFetching(true);
    try {
      const preview = data(await api.post("/products/preview", { url: link }));
      setEditing({ ...EMPTY, ...preview, links: { ...EMPTY.links, ...(preview.links || {}) }, url: preview.url || (preview.kind === "web" ? link : ""), slug: slugify(preview.name || "") });
      setUrl("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't read that link");
      setEditing({ ...EMPTY, url: link, links: { ...EMPTY.links, website: link } });
    } finally {
      setFetching(false);
    }
  };

  const reorder = (next) => {
    setProducts(next);
    api.put("/products/reorder", { ids: next.map((p) => p._id) }).catch(() => toast.error("Couldn't save the order"));
  };

  const toggle = async (product) => {
    setProducts((list) => list.map((p) => (p._id === product._id ? { ...p, isVisible: !p.isVisible } : p)));
    await api.put(`/products/${product._id}`, { isVisible: !product.isVisible }).catch(() => load());
  };

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Editor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <Package size={28} /> Products
        </h1>
        <p className="text-body mt-2">Live things you&apos;ve shipped — shown in their own section, separate from projects.</p>
      </section>

      <form onSubmit={quickAdd} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-primary">
          <Link2 size={16} className="shrink-0 text-muted" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a website, App Store or Google Play link — e.g. qrgendash.com" className="h-12 min-w-0 flex-1 bg-transparent text-small outline-none" aria-label="Product link" />
        </label>
        <button type="submit" disabled={fetching || !url.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-small font-medium text-background disabled:opacity-40">
          {fetching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} {fetching ? "Reading the page…" : "Fetch details"}
        </button>
        <button type="button" onClick={() => setEditing({ ...EMPTY })} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-small">
          <Plus size={16} /> Manual
        </button>
      </form>

      {!products ? (
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
      ) : products.length ? (
        <Reorder.Group axis="y" values={products} onReorder={reorder} className="space-y-2.5">
          {products.map((product) => (
            <Row key={product._id} product={product} onEdit={() => setEditing({ ...EMPTY, ...product, links: { ...EMPTY.links, ...(product.links || {}) } })} onToggle={() => toggle(product)} onDelete={() => setToDelete(product)} />
          ))}
        </Reorder.Group>
      ) : (
        <p className="py-6 text-center text-small text-muted">No products yet — paste a link above to add your first one. The Products section appears on your portfolio once there&apos;s one.</p>
      )}

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Delete this product?"
        message={`“${toDelete?.name || ""}” will be removed from your portfolio.`}
        confirmText="Delete"
        onConfirm={async () => {
          await api.delete(`/products/${toDelete._id}`).catch(() => toast.error("Couldn't delete"));
          setToDelete(null);
          load();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default ProductsAdmin;
