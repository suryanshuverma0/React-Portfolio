/* ========================================
   RESUME MODEL — templates, fonts, defaults
   and the view model every template renders.

   All templates are single-column with real
   text, standard section names and simple
   bullets, so ATS parsers read them cleanly
   (the same principles as Jake's Resume).
   They differ in typography, header layout,
   heading style, entry layout and density.
========================================= */

export const SECTION_LABELS = {
  summary: "Summary",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
  certificates: "Certifications",
  custom: "Additional",
};

export const RESUME_FONTS = [
  { name: "Source Serif 4", spec: "ital,wght@0,400;0,600;0,700;1,400", stack: "Georgia, serif" },
  { name: "Tinos", spec: "ital,wght@0,400;0,700;1,400;1,700", stack: "'Times New Roman', Times, serif" },
  { name: "EB Garamond", spec: "ital,wght@0,400;0,600;0,700;1,400", stack: "Garamond, Georgia, serif" },
  { name: "Lora", spec: "ital,wght@0,400;0,600;0,700;1,400", stack: "Georgia, serif" },
  { name: "Libre Baskerville", spec: "ital,wght@0,400;0,700;1,400", stack: "Baskerville, Georgia, serif" },
  { name: "Merriweather", spec: "ital,wght@0,400;0,700;1,400", stack: "Georgia, serif" },
  { name: "Inter", spec: "wght@400;500;600;700", stack: "Arial, Helvetica, sans-serif" },
  { name: "Roboto", spec: "wght@400;500;700", stack: "Arial, Helvetica, sans-serif" },
  { name: "IBM Plex Sans", spec: "wght@400;500;600;700", stack: "Arial, Helvetica, sans-serif" },
  { name: "Lato", spec: "wght@400;700", stack: "Arial, Helvetica, sans-serif" },
  { name: "Open Sans", spec: "wght@400;600;700", stack: "Arial, Helvetica, sans-serif" },
  { name: "Source Sans 3", spec: "wght@400;600;700", stack: "Arial, Helvetica, sans-serif" },
];

const FONT_BY_NAME = new Map(RESUME_FONTS.map((f) => [f.name, f]));

export const fontStack = (name) => {
  const font = FONT_BY_NAME.get(name) || RESUME_FONTS[0];
  return `"${font.name}", ${font.stack}`;
};

export const ensureResumeFont = (name) => {
  const font = FONT_BY_NAME.get(name);
  if (!font || typeof document === "undefined") return;
  const id = `resume-font-${font.name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name).replace(/%20/g, "+")}:${font.spec}&display=swap`;
  document.head.appendChild(link);
};

/*
  Template design tokens:
  header:   center | left | left-rule | split
  name:     size (em), weight, caps (none|upper|small)
  heading:  rule | smallcaps-rule | accent-bar | accent-underline | caps | double-rule | center-rule | center-caps | band
  entry:    jake (org/date, role/location) | inline (role, org — date) | stacked (role, then org · place · date)
  skills:   categories | inline | grid
*/
export const TEMPLATES = [
  {
    id: "jake",
    name: "Jake",
    blurb: "The classic tech resume — centred name, small-caps headings, crisp rules.",
    defaults: { font: "Source Serif 4", accent: "#111111", fontSize: 10.5, lineHeight: 1.25, margin: 0.5 },
    design: { header: "center", name: { size: 2.4, weight: 700, caps: "small" }, heading: "smallcaps-rule", entry: "jake", skills: "categories", bullet: "•", sep: " | ", accentOn: [] },
    order: ["education", "experience", "projects", "skills", "certificates", "summary", "custom"],
  },
  {
    id: "classic",
    name: "Classic",
    blurb: "Times-style serif with uppercase headings — at home in any recruiter's inbox.",
    defaults: { font: "Tinos", accent: "#111111", fontSize: 11, lineHeight: 1.3, margin: 0.6 },
    design: { header: "left-rule", name: { size: 2.1, weight: 700, caps: "upper" }, heading: "caps", entry: "inline", skills: "categories", bullet: "•", sep: " · ", accentOn: [] },
  },
  {
    id: "modern",
    name: "Modern",
    blurb: "Clean sans-serif with a colour accent bar on each heading.",
    defaults: { font: "Inter", accent: "#2563eb", fontSize: 10, lineHeight: 1.35, margin: 0.55 },
    design: { header: "left", name: { size: 2.3, weight: 700, caps: "none" }, heading: "accent-bar", entry: "stacked", skills: "grid", bullet: "•", sep: "  ·  ", accentOn: ["heading", "headline"] },
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Lots of white space, quiet labels, no rules — lets the content breathe.",
    defaults: { font: "IBM Plex Sans", accent: "#111111", fontSize: 10, lineHeight: 1.4, margin: 0.7 },
    design: { header: "left", name: { size: 2, weight: 600, caps: "none" }, heading: "minimal", entry: "stacked", skills: "categories", bullet: "–", sep: "  ·  ", accentOn: [] },
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Dense and tidy — fits a lot on one page without feeling cramped.",
    defaults: { font: "Roboto", accent: "#111111", fontSize: 9.5, lineHeight: 1.2, margin: 0.4, sectionSpacing: 0.7 },
    design: { header: "center", name: { size: 1.9, weight: 700, caps: "upper" }, heading: "rule", entry: "inline", skills: "inline", bullet: "•", sep: " | ", accentOn: [] },
  },
  {
    id: "executive",
    name: "Executive",
    blurb: "Summary-first with a strong serif name and double rules.",
    defaults: { font: "Lora", accent: "#1e293b", fontSize: 10.5, lineHeight: 1.35, margin: 0.65 },
    design: { header: "left-rule", name: { size: 2.5, weight: 700, caps: "none" }, heading: "double-rule", entry: "jake", skills: "categories", bullet: "▪", sep: "  |  ", accentOn: ["name", "heading"] },
    order: ["summary", "experience", "projects", "skills", "education", "certificates", "custom"],
  },
  {
    id: "technical",
    name: "Technical",
    blurb: "Skills up front, tech stacks in mono — built for engineering roles.",
    defaults: { font: "IBM Plex Sans", accent: "#0f766e", fontSize: 10, lineHeight: 1.3, margin: 0.5 },
    design: { header: "split", name: { size: 2.2, weight: 700, caps: "none" }, heading: "accent-underline", entry: "jake", skills: "grid", bullet: "›", sep: " · ", accentOn: ["heading"], monoTech: true },
    order: ["summary", "skills", "experience", "projects", "education", "certificates", "custom"],
  },
  {
    id: "academic",
    name: "Academic",
    blurb: "Garamond, centred headings — for research, education and papers.",
    defaults: { font: "EB Garamond", accent: "#111111", fontSize: 11.5, lineHeight: 1.3, margin: 0.75 },
    design: { header: "center", name: { size: 2.3, weight: 600, caps: "none" }, heading: "center-rule", entry: "jake", skills: "categories", bullet: "•", sep: " · ", accentOn: [] },
    order: ["education", "projects", "experience", "certificates", "skills", "summary", "custom"],
  },
  {
    id: "elegant",
    name: "Elegant",
    blurb: "Baskerville with spaced small caps and a warm accent.",
    defaults: { font: "Libre Baskerville", accent: "#7c2d12", fontSize: 9.5, lineHeight: 1.45, margin: 0.7 },
    design: { header: "center", name: { size: 2.2, weight: 400, caps: "upper", tracking: "0.12em" }, heading: "center-caps", entry: "stacked", skills: "categories", bullet: "◦", sep: "   ·   ", accentOn: ["heading", "name"] },
  },
  {
    id: "harvard",
    name: "Harvard",
    blurb: "The career-office standard — centred, bold headings, dates on the right.",
    defaults: { font: "Tinos", accent: "#111111", fontSize: 11, lineHeight: 1.25, margin: 0.6 },
    design: { header: "center", name: { size: 2, weight: 700, caps: "none" }, heading: "band", entry: "jake", skills: "categories", bullet: "•", sep: " • ", accentOn: [] },
    order: ["summary", "education", "experience", "projects", "skills", "certificates", "custom"],
  },
];

export const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export const DEFAULT_SECTION_ORDER = ["summary", "education", "experience", "projects", "skills", "certificates", "custom"];

/* ---------- defaults ---------- */

export const defaultConfig = (source, templateId = "jake") => {
  const t = TEMPLATE_BY_ID.get(templateId) || TEMPLATES[0];
  const order = t.order || DEFAULT_SECTION_ORDER;
  const projects = [...(source?.projects || [])].sort((a, b) => Number(b.featured) - Number(a.featured));
  return {
    template: t.id,
    style: { ...t.defaults, pageSize: "a4", sectionSpacing: t.defaults.sectionSpacing ?? 1 },
    header: { show: { email: true, phone: true, website: true, linkedin: true, github: true, location: false } },
    summary: source?.identity?.summary || "",
    sections: order.map((id) => ({ id, visible: id !== "custom" && (id !== "summary" || Boolean(source?.identity?.summary)) })),
    selected: {
      experience: (source?.experience || []).map((e) => e._id),
      projects: projects.slice(0, 4).map((p) => p._id),
      education: (source?.education || []).map((e) => e._id),
      skills: (source?.skills || []).map((s) => s._id),
      certificates: (source?.certificates || []).filter((c) => c.featured).map((c) => c._id),
    },
    options: { projectTech: true, projectLinks: true, experienceTech: false, skillsLayout: "auto", dateStyle: "short" },
    overrides: {},
    custom: { title: "Achievements", items: [] },
  };
};

/* ---------- formatting ---------- */

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const monthYear = (value, style) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  if (style === "numeric") return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  return `${(style === "long" ? MONTHS_LONG : MONTHS_SHORT)[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const dateRange = (start, end, current, style = "short") => {
  const a = monthYear(start, style);
  const b = current ? "Present" : monthYear(end, style);
  return [a, b].filter(Boolean).join(" – ");
};

export const yearRange = (start, end, current) => [start, current ? "Present" : end].filter(Boolean).join(" – ");

// Description → bullet lines (one per line, or per sentence for prose).
export const toBullets = (text = "", max = 6) => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*([-*•▪◦›]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  const parts = lines.length > 1 ? lines : String(text).split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, max);
};

const prettyUrl = (url = "") => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

/* ---------- view model ---------- */

// config + resolved data → what templates render.
export const buildView = (config, data, siteUrl) => {
  const id = data?.identity || {};
  const h = config.header || {};
  const show = h.show || {};
  const opt = config.options || {};
  const ov = config.overrides || {};
  const dateStyle = opt.dateStyle || "short";

  const website = h.website || siteUrl || "";
  const contacts = [
    show.phone && (h.phone || id.phone) && { type: "phone", label: h.phone || id.phone, href: `tel:${(h.phone || id.phone).replace(/\s+/g, "")}` },
    show.email && (h.email || id.email) && { type: "email", label: h.email || id.email, href: `mailto:${h.email || id.email}` },
    show.location && h.location && { type: "location", label: h.location },
    show.website && website && { type: "website", label: prettyUrl(website), href: website },
    show.linkedin && (h.linkedin || id.linkedin) && { type: "linkedin", label: prettyUrl(h.linkedin || id.linkedin), href: h.linkedin || id.linkedin },
    show.github && (h.github || id.github) && { type: "github", label: prettyUrl(h.github || id.github), href: h.github || id.github },
  ].filter(Boolean);

  const pick = (key) => {
    const byId = new Map((data?.[key] || []).map((d) => [String(d._id), d]));
    return (config.selected?.[key] || []).map((x) => byId.get(String(x))).filter(Boolean);
  };

  const experience = pick("experience").map((e) => {
    const o = ov[e._id] || {};
    return {
      id: e._id,
      title: o.title || e.role,
      org: e.company,
      place: e.location || "",
      date: dateRange(e.startDate, e.endDate, e.isCurrent, dateStyle),
      bullets: o.bullets?.length ? o.bullets : toBullets(e.description),
      tech: opt.experienceTech ? o.tech || (e.technologies || []).join(", ") : "",
    };
  });

  const projects = pick("projects").map((p) => {
    const o = ov[p._id] || {};
    const links = opt.projectLinks
      ? [p.liveUrl && { label: "Live", href: p.liveUrl }, p.githubUrl && { label: "Code", href: p.githubUrl }].filter(Boolean)
      : [];
    return {
      id: p._id,
      title: o.title || p.title,
      org: o.subtitle || "",
      tech: opt.projectTech ? o.tech || (p.technologies || []).slice(0, 8).join(", ") : "",
      links,
      bullets: o.bullets?.length ? o.bullets : (p.features?.length ? p.features.slice(0, 4) : toBullets(p.description, 3)),
    };
  });

  const education = pick("education").map((e) => {
    const o = ov[e._id] || {};
    return {
      id: e._id,
      title: o.title || e.institution,
      org: o.subtitle || e.degree,
      date: yearRange(e.startYear, e.endYear, e.current),
      bullets: o.bullets?.length ? o.bullets : [],
    };
  });

  const certificates = pick("certificates").map((c) => ({ id: c._id, title: c.title, org: c.issuer, date: c.year ? String(c.year) : "", href: c.verifyUrl || "" }));

  const skillRows = pick("skills");
  const groups = [];
  skillRows.forEach((s) => {
    const g = groups.find((x) => x.category === s.category) || (groups.push({ category: s.category, items: [] }), groups.at(-1));
    g.items.push(s.name);
  });

  const custom = (config.custom?.items || []).filter((i) => i.heading || i.bullets?.length);

  const sections = (config.sections || [])
    .filter((s) => s.visible)
    .map((s) => {
      const title = s.title || (s.id === "custom" ? config.custom?.title || SECTION_LABELS.custom : SECTION_LABELS[s.id]);
      if (s.id === "summary") return config.summary?.trim() ? { id: "summary", title, text: config.summary.trim() } : null;
      if (s.id === "experience") return experience.length ? { id: s.id, title, entries: experience } : null;
      if (s.id === "projects") return projects.length ? { id: s.id, title, entries: projects } : null;
      if (s.id === "education") return education.length ? { id: s.id, title, entries: education } : null;
      if (s.id === "certificates") return certificates.length ? { id: s.id, title, entries: certificates } : null;
      if (s.id === "skills") return groups.length ? { id: s.id, title, groups } : null;
      if (s.id === "custom") return custom.length ? { id: s.id, title, entries: custom.map((c, i) => ({ id: `c${i}`, title: c.heading, org: c.subheading, date: c.date, bullets: c.bullets || [] })) } : null;
      return null;
    })
    .filter(Boolean);

  return {
    name: h.name || id.name || "Your Name",
    headline: h.headline ?? id.headline ?? "",
    contacts,
    sections,
  };
};
