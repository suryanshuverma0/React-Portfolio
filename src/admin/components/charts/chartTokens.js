// Shared chart tokens and helpers (kept out of ChartKit.jsx so that file
// only exports components).

export const AXIS_TICK = { fontSize: 11, fill: "var(--color-muted)" };
export const GRID = "var(--color-border)";
export const SERIES = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];
export const MUTED = "var(--color-muted)";

export const formatDay = (date) => {
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString(undefined, d ? { month: "short", day: "numeric" } : { month: "short", year: "2-digit" });
};
