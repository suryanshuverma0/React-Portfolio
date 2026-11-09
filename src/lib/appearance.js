import { useSyncExternalStore } from "react";

/* ========================================
   SITE APPEARANCE

   The admin "Appearance" page saves one
   config (colours, fonts, shape, effects and
   homepage section order). This module turns
   it into CSS custom properties + Google Font
   links and shares it with React.

   - Applies to the public site only. The
     admin dashboard always keeps the built-in
     look, so a bad palette can't lock you out.
   - The last config is cached in localStorage
     and applied before React renders, so
     repeat visits paint in the right theme
     with no flash; the server copy then
     refreshes it.
   - Inside the admin preview iframe
     (?preview=1) drafts arrive by postMessage
     and are shown without being saved.
   - Every value is normalized against an
     allowlist before it reaches CSS.
========================================= */

/* ---------- sections ---------- */

// Homepage sections that can be reordered or hidden. The hero always
// stays first. `anchor` is the in-page id the navbar links to.
export const SECTION_DEFS = [
  { id: "marquee", label: "Tech marquee", hint: "Scrolling strip of technologies under the hero", anchor: null },
  { id: "research", label: "Research", hint: "Published paper and results", anchor: "research" },
  { id: "about", label: "About", hint: "Bio and background", anchor: "about" },
  { id: "experience", label: "Experience", hint: "Work history timeline", anchor: "experience" },
  { id: "projects", label: "Projects", hint: "Featured and other projects", anchor: "projects" },
  { id: "products", label: "Products", hint: "Live products and apps (shows once you add one)", anchor: "products" },
  { id: "skills", label: "Skills", hint: "Technologies and tools", anchor: "skills" },
  { id: "services", label: "Services", hint: "What you offer", anchor: "services" },
  { id: "certificates", label: "Certificates", hint: "Certifications gallery", anchor: "certificates" },
  { id: "coding-activity", label: "Coding activity", hint: "GitHub / LeetCode activity", anchor: "coding-activity" },
  { id: "faq", label: "FAQ", hint: "Frequently asked questions", anchor: "faq" },
  { id: "contact", label: "Contact", hint: "Contact form and links", anchor: "contact" },
];

const SECTION_IDS = new Set(SECTION_DEFS.map((s) => s.id));

/* ---------- fonts ---------- */

// Curated Google Fonts. `spec` is the exact axis request for the CSS2 API
// (a wrong range makes Google reject the whole request, so each family
// loads through its own <link>). `loaded` fonts already ship in index.html.
export const FONTS = [
  { name: "Geist", category: "sans", spec: "wght@100..900", loaded: true },
  { name: "Inter", category: "sans", spec: "wght@100..900" },
  { name: "Manrope", category: "sans", spec: "wght@200..800" },
  { name: "DM Sans", category: "sans", spec: "wght@100..900" },
  { name: "Plus Jakarta Sans", category: "sans", spec: "wght@200..800" },
  { name: "Outfit", category: "sans", spec: "wght@100..900" },
  { name: "Space Grotesk", category: "sans", spec: "wght@300..700" },
  { name: "Sora", category: "sans", spec: "wght@100..800" },
  { name: "Poppins", category: "sans", spec: "wght@300;400;500;600;700;800" },
  { name: "Work Sans", category: "sans", spec: "wght@100..900" },
  { name: "IBM Plex Sans", category: "sans", spec: "wght@300;400;500;600;700" },
  { name: "Figtree", category: "sans", spec: "wght@300..900" },
  { name: "Urbanist", category: "sans", spec: "wght@100..900" },
  { name: "Lexend", category: "sans", spec: "wght@100..900" },
  { name: "Syne", category: "display", spec: "wght@400..800" },
  { name: "Bricolage Grotesque", category: "display", spec: "wght@200..800" },
  { name: "Unbounded", category: "display", spec: "wght@200..900" },
  { name: "Archivo", category: "display", spec: "wght@100..900" },
  { name: "Instrument Serif", category: "serif", spec: "ital@0;1", loaded: true },
  { name: "Fraunces", category: "serif", spec: "wght@300..900" },
  { name: "Playfair Display", category: "serif", spec: "wght@400..900" },
  { name: "DM Serif Display", category: "serif", spec: "ital@0;1" },
  { name: "Lora", category: "serif", spec: "wght@400..700" },
  { name: "Libre Baskerville", category: "serif", spec: "wght@400;700" },
  { name: "Cormorant Garamond", category: "serif", spec: "wght@300;400;500;600;700" },
  { name: "Newsreader", category: "serif", spec: "wght@200..800" },
  { name: "EB Garamond", category: "serif", spec: "wght@400..800" },
  { name: "Geist Mono", category: "mono", spec: "wght@300..700", loaded: true },
  { name: "JetBrains Mono", category: "mono", spec: "wght@100..800" },
  { name: "IBM Plex Mono", category: "mono", spec: "wght@400;500;600" },
  { name: "Fira Code", category: "mono", spec: "wght@300..700" },
  { name: "Space Mono", category: "mono", spec: "wght@400;700" },
  { name: "DM Mono", category: "mono", spec: "wght@300;400;500" },
];

const FONT_BY_NAME = new Map(FONTS.map((f) => [f.name, f]));

const FALLBACKS = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  display: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const fontStack = (name) => {
  const font = FONT_BY_NAME.get(name);
  return `"${font.name}", ${FALLBACKS[font.category]}`;
};

/* ---------- colours & presets ---------- */

export const COLOR_FIELDS = [
  { key: "background", label: "Background", hint: "Page background" },
  { key: "surface", label: "Surface", hint: "Subtle fills, hovers" },
  { key: "card", label: "Card", hint: "Panels and cards" },
  { key: "primary", label: "Text", hint: "Headings, body ink, buttons" },
  { key: "secondary", label: "Secondary text", hint: "Paragraphs and descriptions" },
  { key: "muted", label: "Muted text", hint: "Labels, captions, numbers" },
  { key: "border", label: "Border", hint: "Hairlines and dividers" },
  { key: "borderStrong", label: "Strong border", hint: "Hover and outline edges" },
  { key: "accent", label: "Accent", hint: "Italic accent words, selection, focus" },
];

export const PRESETS = [
  {
    id: "monochrome",
    name: "Monochrome",
    description: "The original black-and-white editorial look",
    colors: {
      light: { background: "#ffffff", surface: "#f3f4f6", card: "#f8fafc", primary: "#0a0a0a", secondary: "#525252", muted: "#737373", border: "#e4e4e7", borderStrong: "#d4d4d8", accent: "#0a0a0a" },
      dark: { background: "#0a0a0a", surface: "#111111", card: "#171717", primary: "#fafafa", secondary: "#a1a1aa", muted: "#71717a", border: "#232323", borderStrong: "#333333", accent: "#fafafa" },
    },
    typography: { headingFont: "Geist", bodyFont: "Geist", accentFont: "Instrument Serif", monoFont: "Geist Mono" },
  },
  {
    id: "paper",
    name: "Paper & Ink",
    description: "Warm paper tones with an amber accent",
    colors: {
      light: { background: "#faf7f2", surface: "#f1ece3", card: "#fffdf9", primary: "#1c1917", secondary: "#57534e", muted: "#78716c", border: "#e7e0d5", borderStrong: "#d6cdbf", accent: "#b45309" },
      dark: { background: "#14110f", surface: "#1c1814", card: "#221d18", primary: "#f5f0e8", secondary: "#a8a29e", muted: "#857d77", border: "#2e2822", borderStrong: "#3d352d", accent: "#f59e0b" },
    },
    typography: { headingFont: "Fraunces", bodyFont: "Inter", accentFont: "Fraunces", monoFont: "IBM Plex Mono" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Cool slate with an electric blue accent",
    colors: {
      light: { background: "#f8fafc", surface: "#eef2f7", card: "#ffffff", primary: "#0f172a", secondary: "#475569", muted: "#64748b", border: "#e2e8f0", borderStrong: "#cbd5e1", accent: "#2563eb" },
      dark: { background: "#0b1120", surface: "#111a2e", card: "#131d33", primary: "#e2e8f0", secondary: "#94a3b8", muted: "#7385a0", border: "#1e293b", borderStrong: "#334155", accent: "#60a5fa" },
    },
    typography: { headingFont: "Space Grotesk", bodyFont: "Inter", accentFont: "Instrument Serif", monoFont: "JetBrains Mono" },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Calm greens, natural and grounded",
    colors: {
      light: { background: "#f7faf7", surface: "#edf3ee", card: "#fbfdfb", primary: "#0f1f17", secondary: "#4b5d52", muted: "#6b7c71", border: "#dfe9e2", borderStrong: "#c9d8cd", accent: "#15803d" },
      dark: { background: "#0a120d", surface: "#101b14", card: "#132017", primary: "#e8f2ea", secondary: "#9fb3a5", muted: "#7a9182", border: "#1c2b21", borderStrong: "#29402f", accent: "#4ade80" },
    },
    typography: { headingFont: "Manrope", bodyFont: "Manrope", accentFont: "Newsreader", monoFont: "DM Mono" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Soft blush with a vivid rose accent",
    colors: {
      light: { background: "#fffaf8", surface: "#fbefea", card: "#ffffff", primary: "#1f1414", secondary: "#5f4a4a", muted: "#826a6a", border: "#f1e1dc", borderStrong: "#e6cdc6", accent: "#e11d48" },
      dark: { background: "#120c0d", surface: "#1b1214", card: "#211618", primary: "#f8eeee", secondary: "#b9a2a4", muted: "#937a7d", border: "#2d1f22", borderStrong: "#3f2b2f", accent: "#fb7185" },
    },
    typography: { headingFont: "Syne", bodyFont: "DM Sans", accentFont: "Playfair Display", monoFont: "Space Mono" },
  },
  {
    id: "violet",
    name: "Violet",
    description: "Lavender neutrals with a deep violet accent",
    colors: {
      light: { background: "#fbfaff", surface: "#f1effb", card: "#ffffff", primary: "#17132b", secondary: "#545072", muted: "#75718f", border: "#e5e2f3", borderStrong: "#d2cdea", accent: "#7c3aed" },
      dark: { background: "#0d0b16", surface: "#15121f", card: "#1a1626", primary: "#ece9fa", secondary: "#a6a1c2", muted: "#857f9f", border: "#25203a", borderStrong: "#352e52", accent: "#a78bfa" },
    },
    typography: { headingFont: "Sora", bodyFont: "Plus Jakarta Sans", accentFont: "DM Serif Display", monoFont: "Fira Code" },
  },
];

/* ---------- defaults & normalization ---------- */

// Mirrors the built-in CSS exactly, so "no config" and "defaults" match.
export const DEFAULT_APPEARANCE = {
  version: 1,
  preset: "monochrome",
  colors: PRESETS[0].colors,
  typography: {
    ...PRESETS[0].typography,
    baseSize: 16,
    headingWeight: 600,
    headingTracking: 1,
  },
  shape: { roundness: 1, buttons: "pill" },
  effects: { grain: true, cursor: true, smoothScroll: true, sectionNumbers: true, accentButtons: false },
  defaultMode: "system",
  sections: SECTION_DEFS.map(({ id }) => ({ id, visible: true })),
};

const HEX = /^#[0-9a-f]{6}$/i;

const clamp = (value, min, max, fallback) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

const bool = (value, fallback) => (typeof value === "boolean" ? value : fallback);

const normalizePalette = (palette, fallback) =>
  Object.fromEntries(
    COLOR_FIELDS.map(({ key }) => [key, HEX.test(palette?.[key] || "") ? palette[key].toLowerCase() : fallback[key]]),
  );

const normalizeFont = (name, fallback) => (FONT_BY_NAME.has(name) ? name : fallback);

// Any input (old shape, partial, hostile) → a complete, safe config.
export const normalizeAppearance = (input) => {
  const d = DEFAULT_APPEARANCE;
  const c = input && typeof input === "object" ? input : {};
  const t = c.typography || {};
  const s = c.shape || {};
  const e = c.effects || {};

  const seen = new Set();
  const sections = (Array.isArray(c.sections) ? c.sections : [])
    .filter((item) => item && SECTION_IDS.has(item.id) && !seen.has(item.id) && seen.add(item.id))
    .map((item) => ({ id: item.id, visible: bool(item.visible, true) }));

  // Sections added to the site after this config was saved show up, at the end.
  SECTION_DEFS.forEach(({ id }) => {
    if (!seen.has(id)) sections.push({ id, visible: true });
  });

  return {
    version: 1,
    // "" = custom colours; missing = never customized (the default preset).
    preset: typeof c.preset === "string" && /^[a-z0-9-]{0,40}$/.test(c.preset) ? c.preset : d.preset,
    colors: {
      light: normalizePalette(c.colors?.light, d.colors.light),
      dark: normalizePalette(c.colors?.dark, d.colors.dark),
    },
    typography: {
      headingFont: normalizeFont(t.headingFont, d.typography.headingFont),
      bodyFont: normalizeFont(t.bodyFont, d.typography.bodyFont),
      accentFont: normalizeFont(t.accentFont, d.typography.accentFont),
      monoFont: normalizeFont(t.monoFont, d.typography.monoFont),
      baseSize: clamp(t.baseSize, 14, 18, d.typography.baseSize),
      headingWeight: Math.round(clamp(t.headingWeight, 300, 900, d.typography.headingWeight) / 100) * 100,
      headingTracking: clamp(t.headingTracking, 0, 1.5, d.typography.headingTracking),
    },
    shape: {
      roundness: clamp(s.roundness, 0, 1.5, d.shape.roundness),
      buttons: pick(s.buttons, ["pill", "rounded", "square"], d.shape.buttons),
    },
    effects: {
      grain: bool(e.grain, d.effects.grain),
      cursor: bool(e.cursor, d.effects.cursor),
      smoothScroll: bool(e.smoothScroll, d.effects.smoothScroll),
      sectionNumbers: bool(e.sectionNumbers, d.effects.sectionNumbers),
      accentButtons: bool(e.accentButtons, d.effects.accentButtons),
    },
    defaultMode: pick(c.defaultMode, ["system", "light", "dark"], d.defaultMode),
    sections,
  };
};

/* ---------- CSS ---------- */

const paletteVars = (p) =>
  [
    `--color-background:${p.background}`,
    `--color-surface:${p.surface}`,
    `--color-card:${p.card}`,
    `--color-primary:${p.primary}`,
    `--color-secondary:${p.secondary}`,
    `--color-muted:${p.muted}`,
    `--color-border:${p.border}`,
    `--color-border-strong:${p.borderStrong}`,
    `--site-accent:${p.accent}`,
    // Accent words keep inheriting their surroundings unless the accent
    // is a real colour of its own.
    `--accent-ink:${p.accent === p.primary ? "inherit" : p.accent}`,
  ].join(";");

// Tailwind v4 default radius scale (rem).
const RADIUS_TOKENS = [["xs", 0.125], ["sm", 0.25], ["md", 0.375], ["lg", 0.5], ["xl", 0.75], ["2xl", 1], ["3xl", 1.5], ["4xl", 2]];

const BUTTON_RADIUS = { pill: "999px", rounded: "calc(14px * var(--radius-scale))", square: "0px" };

export const buildAppearanceCss = (config) => {
  const { colors, typography: t, shape, effects } = config;

  return [
    `:root{${paletteVars(colors.light)};`,
    `--font-sans:${fontStack(t.bodyFont)};`,
    `--font-heading:${fontStack(t.headingFont)};`,
    `--font-serif:${fontStack(t.accentFont)};`,
    `--font-mono:${fontStack(t.monoFont)};`,
    `--heading-weight:${t.headingWeight};`,
    `--heading-tracking:${t.headingTracking};`,
    `--radius-scale:${shape.roundness};`,
    `--btn-radius:${BUTTON_RADIUS[shape.buttons]};`,
    `--btn-bg:${effects.accentButtons ? "var(--site-accent)" : "var(--color-primary)"};`,
    // Tailwind's rounded-* sizes follow the roundness setting too.
    RADIUS_TOKENS.map(([name, rem]) => `--radius-${name}:calc(${rem}rem * var(--radius-scale))`).join(";"),
    "}",
    `:root.dark{${paletteVars(colors.dark)}}`,
    `html{font-size:${(t.baseSize / 16) * 100}%}`,
  ].join("");
};

/* ---------- DOM ---------- */

const STYLE_ID = "site-appearance";
const CACHE_KEY = "appearance:v1";
const MODE_KEY = "appearance:mode";

const isBrowser = typeof window !== "undefined";
const isPreview = isBrowser && new URLSearchParams(window.location.search).has("preview");

let enabled = isBrowser && !window.location.pathname.startsWith("/dashboard");

const styleElement = () => {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    // Last in <head>, so it wins over the built-in theme.
    document.head.appendChild(el);
  }
  return el;
};

// Adds the Google Fonts stylesheet for one family (once). Exported so the
// admin can show font samples.
export const ensureFont = (name) => {
  const font = FONT_BY_NAME.get(name);
  if (!font || font.loaded || typeof document === "undefined") return;

  const id = `font-${font.name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name).replace(/%20/g, "+")}:${font.spec}&display=swap`;
  document.head.appendChild(link);
};

const loadFonts = (config) => {
  const { headingFont, bodyFont, accentFont, monoFont } = config.typography;
  [headingFont, bodyFont, accentFont, monoFont].forEach(ensureFont);
};

const render = (config) => {
  if (!isBrowser) return;

  const el = styleElement();
  el.textContent = buildAppearanceCss(config);
  el.disabled = !enabled;

  if (enabled) loadFonts(config);
};

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

const writeCache = (config) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    // Read by the pre-paint script in index.html (default light/dark).
    localStorage.setItem(MODE_KEY, config.defaultMode);
  } catch {
    /* storage unavailable — the site still themes, just after the fetch */
  }
};

// Visitors who never used the theme toggle get the site's default mode.
const applyDefaultMode = (mode) => {
  let chosen = null;
  try {
    chosen = localStorage.getItem("theme");
  } catch {
    /* ignore */
  }

  if (chosen || !enabled) return;

  const dark =
    mode === "dark" || (mode === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", Boolean(dark));
};

/* ---------- store ---------- */

let current = normalizeAppearance(isBrowser ? readCache() : null);
let previewDraft = false;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getAppearance = () => current;

export const useAppearance = () => useSyncExternalStore(subscribe, getAppearance, getAppearance);

export const setAppearance = (input, { persist = true } = {}) => {
  current = normalizeAppearance(input);
  render(current);
  if (persist) writeCache(current);
  emit();
};

// Called on every route change: the admin dashboard keeps the built-in look.
export const setAppearanceScope = (pathname) => {
  const next = !pathname.startsWith("/dashboard");
  if (next === enabled) return;

  enabled = next;
  render(current);
};

export const fetchPublicAppearance = async (api) => {
  const response = await api.get("/appearance/public");
  return response.data?.data?.config ?? null;
};

// Boot: paint the cached config now, then refresh from the server.
export const initAppearance = (api) => {
  if (!isBrowser) return;

  render(current);

  if (isPreview) {
    // The admin's preview pane sends drafts here; nothing is persisted.
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type !== "appearance:preview") return;

      previewDraft = true;
      setAppearance(data.config, { persist: false });

      if (data.mode === "light" || data.mode === "dark") {
        document.documentElement.classList.toggle("dark", data.mode === "dark");
      }
    });

    window.parent?.postMessage({ type: "appearance:preview-ready" }, window.location.origin);
  }

  fetchPublicAppearance(api)
    .then((config) => {
      if (previewDraft) return;
      setAppearance(config, { persist: !isPreview });
      if (!isPreview) applyDefaultMode(current.defaultMode);
    })
    .catch(() => {
      /* offline / API down: the cached or built-in look stays */
    });
};

/* ---------- navbar ---------- */

const SECTION_BY_ANCHOR = new Map(SECTION_DEFS.filter((s) => s.anchor).map((s) => [`#${s.anchor}`, s.id]));

// Section links follow the homepage order and drop out when hidden.
// Other links (Home, Blog) keep their place: section links are re-sorted
// within the slots section links already occupy.
export const arrangeNavItems = (items, sections) => {
  const order = new Map(sections.map((section, i) => [section.id, i]));
  const visible = new Set(sections.filter((s) => s.visible).map((s) => s.id));

  const sectionOf = (item) => SECTION_BY_ANCHOR.get(item.href);

  const kept = items.filter((item) => !sectionOf(item) || visible.has(sectionOf(item)));
  const sorted = kept
    .filter(sectionOf)
    .sort((a, b) => order.get(sectionOf(a)) - order.get(sectionOf(b)));

  let next = 0;
  return kept.map((item) => (sectionOf(item) ? sorted[next++] : item));
};

// First visible section's anchor, for links whose target was hidden.
export const firstVisibleAnchor = (sections) => {
  const first = sections.find((s) => s.visible && SECTION_DEFS.find((d) => d.id === s.id)?.anchor);
  return first ? `#${SECTION_DEFS.find((d) => d.id === first.id).anchor}` : "#home";
};

export const isSectionVisible = (sections, id) => sections.some((s) => s.id === id && s.visible);
