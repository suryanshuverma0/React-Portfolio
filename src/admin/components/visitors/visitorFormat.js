import {
  Eye,
  LogIn,
  LogOut,
  ArrowDownToLine,
  MousePointerClick,
  ExternalLink,
  Download,
  Mail,
  Send,
  Activity,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

const REGION_NAMES =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export const countryName = (code) => {
  if (!code) return "Unknown";

  try {
    return REGION_NAMES?.of(code) || code;
  } catch {
    return code;
  }
};

// Regional-indicator emoji flag from an ISO-3166 alpha-2 code.
export const countryFlag = (code) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : "🌐";

export const formatLocation = (location) => {
  if (!location?.country) return "Unknown location";

  return [location.city, location.region, countryName(location.country)]
    .filter(Boolean)
    .join(", ");
};

export const formatDuration = (ms) => {
  if (!ms || ms < 1000) return "0s";

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

export const timeAgo = (date) => {
  if (!date) return "—";

  const seconds = Math.round((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(date).toLocaleDateString();
};

// Portfolio section ids (see components/sections/*) → readable names, in
// the order they appear on the home page.
export const SECTION_ORDER = [
  "home",
  "about",
  "experience",
  "skills",
  "services",
  "projects",
  "research",
  "certificates",
  "coding-activity",
  "contact",
];

const SECTION_LABELS = {
  home: "Hero",
  "coding-activity": "Coding Activity",
  navbar: "Navigation",
};

export const sectionLabel = (id) => {
  if (!id) return "";

  return (
    SECTION_LABELS[id] ||
    id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const pageLabel = (path) => {
  if (!path || path === "/") return "Home";
  if (path === "/blog") return "Blog";
  if (path.startsWith("/blog/")) return `Blog · ${path.slice(6)}`;
  if (path.startsWith("/projects/")) return `Project · ${path.slice(10)}`;

  return path;
};

export const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export const describeReferrer = (session) => {
  if (session?.utm?.source) {
    return [session.utm.source, session.utm.medium, session.utm.campaign]
      .filter(Boolean)
      .join(" / ");
  }

  if (!session?.referrer) return "Direct";

  try {
    return new URL(session.referrer).hostname.replace(/^www\./, "");
  } catch {
    return session.referrer;
  }
};

/* ========================================
   Event presentation. Tones are recessive
   (text ink) except the two "conversion"
   moments that deserve to stand out.
========================================= */

export const EVENT_META = {
  page_view: { icon: LogIn, name: "Opened page", tone: "accent" },
  page_leave: { icon: LogOut, name: "Left page", tone: "muted" },
  section_view: { icon: Eye, name: "Viewed section", tone: "default" },
  scroll_depth: { icon: ArrowDownToLine, name: "Scrolled", tone: "muted" },
  click: { icon: MousePointerClick, name: "Clicked", tone: "default" },
  outbound_click: { icon: ExternalLink, name: "Opened link", tone: "default" },
  download: { icon: Download, name: "Downloaded", tone: "highlight" },
  contact_link: { icon: Mail, name: "Contact link", tone: "highlight" },
  form_submit: { icon: Send, name: "Submitted form", tone: "highlight" },
};

export const eventMeta = (type) =>
  EVENT_META[type] || { icon: Activity, name: type, tone: "default" };

export const describeEvent = (event) => {
  switch (event.type) {
    case "page_view":
      return event.title ? `${pageLabel(event.path)} — ${event.title}` : pageLabel(event.path);
    case "page_leave":
      return `${pageLabel(event.path)} after ${formatDuration(event.value)}`;
    case "section_view":
      return `${sectionLabel(event.section)} for ${formatDuration(event.value)}`;
    case "scroll_depth":
      return `${event.value}% of ${pageLabel(event.path)}`;
    case "form_submit":
      return event.label || "Form";
    default:
      return event.label || event.target || "Element";
  }
};
