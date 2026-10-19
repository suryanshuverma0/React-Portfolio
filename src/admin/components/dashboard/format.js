// Formatting helpers shared by the dashboard widgets and page.

export const SOURCE_COLORS = {
  Direct: "var(--color-chart-1)",
  Search: "var(--color-chart-2)",
  Social: "var(--color-chart-3)",
  Referral: "var(--color-chart-4)",
  Card: "var(--color-muted)",
};



const REGION_NAMES =
  typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

export const countryName = (code) => {
  try {
    return REGION_NAMES?.of(code) || code;
  } catch {
    return code;
  }
};

export const countryFlag = (code) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : "🌐";

export const formatDuration = (ms) => {
  if (!ms || ms < 1000) return "0s";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m ? `${m}m ${s % 60}s` : `${s}s`;
};

export const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const e = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / 1024 ** e;
  return `${v >= 100 || e === 0 ? Math.round(v) : v.toFixed(1)} ${units[e]}`;
};

export const compactNumber = (n) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
