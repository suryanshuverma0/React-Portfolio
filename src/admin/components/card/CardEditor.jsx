import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Save } from "lucide-react";

import AdminInput from "../form/AdminInput";
import AdminTextarea from "../form/AdminTextarea";
import AdminSwitch from "../form/AdminSwitch";
import ImageUploader from "../upload/ImageUploader";
import BusinessCard from "../../../components/card/BusinessCard";
import { getCardSettings, updateCardSettings } from "../../services/card.service";
import { uploadImage } from "../../services/upload.service";
import SkeletonCard from "../../../components/common/SkeletonCard";

const LINK_KINDS = [
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
  ["leetcode", "LeetCode"],
  ["twitter", "X (Twitter)"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["website", "Website"],
  ["resume", "Resume"],
  ["calendar", "Book a call"],
  ["custom", "Custom"],
];
const KIND_LABEL = Object.fromEntries(LINK_KINDS);

// Grouped switches for the "What to show" panel. Keys match the backend.
const VISIBILITY_GROUPS = [
  {
    title: "Header",
    items: [
      ["photo", "Photo"],
      ["availability", "Availability badge"],
      ["title", "Title"],
      ["company", "Company"],
      ["location", "Location"],
      ["tagline", "Tagline"],
    ],
  },
  {
    title: "Contact",
    items: [
      ["saveContact", "Save contact button"],
      ["call", "Call button"],
      ["whatsapp", "WhatsApp button"],
      ["email", "Email button"],
    ],
  },
  {
    title: "Content",
    items: [
      ["links", "Links"],
      ["portfolioButton", "View full portfolio button"],
      ["share", "Share button"],
      ["qr", "QR code on card back"],
    ],
  },
];
const ALL_SECTIONS_ON = Object.fromEntries(
  VISIBILITY_GROUPS.flatMap((group) => group.items.map(([key]) => [key, true])),
);

const FINISHES = [
  ["midnight", "Midnight", "linear-gradient(135deg,#0b1324,#111827)"],
  ["black", "Black metal", "linear-gradient(135deg,#2a2a2a,#050505)"],
  ["accent", "Accent colour", null],
];

const ACCENTS = ["#2a78d6", "#0ea5e9", "#7c3aed", "#059669", "#e11d48", "#ea580c", "#0a0a0a"];

const toForm = (card) => ({
  isEnabled: card.isEnabled !== false,
  displayName: card.displayName || "",
  title: card.title || "",
  company: card.company || "",
  tagline: card.tagline || "",
  location: card.location || "",
  availability: card.availability || "",
  photo: card.photo || null,
  email: card.email || "",
  phone: card.phone || "",
  whatsapp: card.whatsapp || "",
  website: card.website || "",
  links: (card.links || []).map((l) => ({ ...l, label: l.label || "", isVisible: l.isVisible !== false })),
  stats: card.stats || [],
  skills: card.skills || [],
  featuredProjects: card.featuredProjects || [],
  accentColor: card.accentColor || "#2a78d6",
  finish: card.finish || "midnight",
  sections: { ...ALL_SECTIONS_ON, ...(card.sections || {}) },
});

function Section({ title, hint, children }) {
  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-title">{title}</h2>
        {hint && <p className="text-muted text-xs mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const iconButton =
  "h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl border border-border bg-surface disabled:opacity-30";

function CardEditor() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getCardSettings()
      .then((card) => setForm(toForm(card)))
      .catch(() => toast.error("Failed to load card"));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setSection = (key, value) =>
    setForm((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));

  const updateItem = (key, index, patch) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const removeItem = (key, index) =>
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));

  const moveItem = (key, index, direction) =>
    setForm((prev) => {
      const list = [...prev[key]];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [key]: list };
    });

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const image = await uploadImage(file, "card");
      set("photo", image);
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      links: form.links
        .filter((l) => l.url.trim())
        .map((l) => ({
          kind: l.kind,
          url: l.url.trim(),
          isVisible: l.isVisible,
          ...(l.label.trim() && { label: l.label.trim() }),
        })),
      stats: form.stats.filter((s) => s.value.trim() && s.label.trim()),
    };

    try {
      setSaving(true);
      const saved = await updateCardSettings(payload);
      setForm(toForm(saved));
      toast.success("Card saved — it's live");
    } catch (error) {
      const first = error.response?.data?.errors?.[0];
      toast.error(first ? `${first.field}: ${first.message}` : "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  // Shape the draft exactly like the public API response for the preview.
  const previewCard = useMemo(() => {
    if (!form) return null;
    // Same stripping the server does for the public card.
    const show = form.sections;
    const keep = (key, value) => (show[key] ? value : "");

    return {
      ...form,
      title: keep("title", form.title),
      company: keep("company", form.company),
      location: keep("location", form.location),
      tagline: keep("tagline", form.tagline),
      availability: keep("availability", form.availability),
      phone: keep("call", form.phone),
      whatsapp: keep("whatsapp", form.whatsapp),
      email: keep("email", form.email),
      photoUrl: show.photo ? form.photo?.url || null : null,
      links: (show.links ? form.links : [])
        .filter((l) => l.isVisible && l.url)
        .map((l) => ({ ...l, label: l.label || KIND_LABEL[l.kind] || "Link" })),
    };
  }, [form]);

  if (!form) return <SkeletonCard />;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] items-start">
      <div className="space-y-6 min-w-0">
        <Section title="Status">
          <AdminSwitch
            label="Card is live at /card"
            checked={form.isEnabled}
            onChange={(value) => set("isEnabled", typeof value === "boolean" ? value : !form.isEnabled)}
          />
        </Section>

        <Section
          title="What to show"
          hint="Turn any part of the card on or off. Hidden details are removed on the server, so they're not in the page or the saved contact either."
        >
          <div className="grid gap-6 md:grid-cols-3">
            {VISIBILITY_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</p>
                {group.items.map(([key, label]) => (
                  <AdminSwitch
                    key={key}
                    label={label}
                    checked={form.sections[key] !== false}
                    onChange={(value) => setSection(key, value)}
                  />
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Identity" hint="Empty fields fall back to your Profile and Settings.">
          <ImageUploader
            label="Card photo"
            preview={form.photo?.url}
            onSelect={handlePhoto}
            onRemove={() => set("photo", null)}
          />
          {uploading && <p className="text-muted text-xs text-center">Uploading…</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <AdminInput label="Name" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
            <AdminInput label="Title" placeholder="Blockchain Developer" value={form.title} onChange={(e) => set("title", e.target.value)} />
            <AdminInput label="Company / affiliation" placeholder="Freelance · Open source" value={form.company} onChange={(e) => set("company", e.target.value)} />
            <AdminInput label="Location" placeholder="Kathmandu, Nepal" value={form.location} onChange={(e) => set("location", e.target.value)} />
            <AdminInput label="Availability badge" placeholder="Open to opportunities" value={form.availability} onChange={(e) => set("availability", e.target.value)} />
          </div>

          <AdminTextarea
            label={`Tagline (${form.tagline.length}/300)`}
            rows={3}
            maxLength={300}
            placeholder="One sentence on what you do and for whom."
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </Section>

        <Section title="Contact" hint="Call and WhatsApp buttons appear when these are filled. Use international format, e.g. +977 98XXXXXXXX.">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminInput label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <AdminInput label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <AdminInput label="WhatsApp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            <AdminInput label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
        </Section>

        <Section title="Links" hint="Shown in this order. Hidden links stay saved but don't appear on the card.">
          <div className="space-y-3">
            {form.links.map((link, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3">
                <select
                  value={link.kind}
                  onChange={(e) => updateItem("links", index, { kind: e.target.value })}
                  className="h-10 px-3 rounded-xl border border-border bg-surface text-small"
                  aria-label="Link type"
                >
                  {LINK_KINDS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={link.label}
                  placeholder={KIND_LABEL[link.kind]}
                  onChange={(e) => updateItem("links", index, { label: e.target.value })}
                  className="h-10 w-32 px-3 rounded-xl border border-border bg-surface text-small"
                  aria-label="Label"
                />
                <input
                  value={link.url}
                  placeholder="https://"
                  onChange={(e) => updateItem("links", index, { url: e.target.value })}
                  className="h-10 flex-1 min-w-[180px] px-3 rounded-xl border border-border bg-surface text-small"
                  aria-label="URL"
                />
                <button type="button" className={iconButton} onClick={() => updateItem("links", index, { isVisible: !link.isVisible })} aria-label={link.isVisible ? "Hide link" : "Show link"}>
                  {link.isVisible ? <Eye size={15} /> : <EyeOff size={15} className="text-muted" />}
                </button>
                <button type="button" className={iconButton} disabled={index === 0} onClick={() => moveItem("links", index, -1)} aria-label="Move up">
                  <ArrowUp size={15} />
                </button>
                <button type="button" className={iconButton} disabled={index === form.links.length - 1} onClick={() => moveItem("links", index, 1)} aria-label="Move down">
                  <ArrowDown size={15} />
                </button>
                <button type="button" className={iconButton} onClick={() => removeItem("links", index)} aria-label="Remove link">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {form.links.length < 12 && (
            <button
              type="button"
              onClick={() => set("links", [...form.links, { kind: "custom", label: "", url: "", isVisible: true }])}
              className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
            >
              <Plus size={15} /> Add link
            </button>
          )}
        </Section>

        <Section title="Appearance" hint="The card's finish, and the accent colour used for its glow and buttons.">
          <div className="grid grid-cols-3 gap-3">
            {FINISHES.map(([value, label, swatch]) => (
              <button
                key={value}
                type="button"
                onClick={() => set("finish", value)}
                aria-pressed={form.finish === value}
                className={`rounded-2xl border p-2 text-small transition ${
                  form.finish === value ? "border-primary" : "border-border"
                }`}
              >
                <span
                  className="block w-full rounded-lg"
                  style={{ aspectRatio: "1.586 / 1", background: swatch || form.accentColor }}
                />
                <span className="mt-2 block">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => set("accentColor", color)}
                aria-label={`Accent ${color}`}
                aria-pressed={form.accentColor === color}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  form.accentColor === color ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <label className="inline-flex items-center gap-2 text-small">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-9 w-12 rounded-lg border border-border bg-surface"
              />
              <code className="text-xs">{form.accentColor}</code>
            </label>
          </div>

        </Section>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="h-control px-6 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2 shadow-lg disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save card"}
          </button>
        </div>
      </div>

      {/* ---------- live preview ---------- */}
      <aside className="xl:sticky xl:top-6">
        <p className="text-small text-muted mb-3 text-center">Live preview (unsaved changes included)</p>
        <div className="mx-auto w-full max-w-[380px] rounded-[40px] border-[10px] border-[var(--color-primary)] bg-background shadow-2xl overflow-hidden">
          <div className="h-[720px] overflow-y-auto">
            <BusinessCard card={previewCard} shareUrl={`${window.location.origin}/card?src=qr`} preview />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CardEditor;
