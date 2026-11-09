/* ========================================
   PERIOD MATH — current vs previous period
   comparisons computed from daily series.

   The comparison request returns a longer
   daily series ending today; the last
   `range` days are the current period and
   the `range` days before that the previous
   one. Deltas are only reported when the
   previous period has data — "up 100% from
   zero" is not a real comparison.
========================================= */

export const splitPeriods = (daily = [], range) => {
  const current = daily.slice(-range);
  const previous = daily.length >= range * 2 ? daily.slice(-range * 2, -range) : [];
  return { current, previous };
};

export const sum = (rows, key) => rows.reduce((t, r) => t + (Number(r[key]) || 0), 0);

// Average of `key` weighted by `weightKey` (e.g. time per session).
export const weightedAvg = (rows, key, weightKey) => {
  const weight = sum(rows, weightKey);
  if (!weight) return 0;
  return rows.reduce((t, r) => t + (Number(r[key]) || 0) * (Number(r[weightKey]) || 0), 0) / weight;
};

// % change, or null when there is nothing to compare against.
export const pctChange = (current, previous) => {
  if (previous === null || previous === undefined || !Number.isFinite(previous) || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// Percentage-point change for rates (bounce, completion…).
export const pointChange = (current, previous) =>
  previous === null || previous === undefined || !Number.isFinite(previous) ? null : Math.round((current - previous) * 10) / 10;

export const ratio = (a, b) => (b ? a / b : 0);

// Pair each current day with the same position in the previous period.
export const alignPeriods = (current, previous, key) =>
  current.map((row, i) => ({
    date: row.date,
    current: Number(row[key]) || 0,
    previous: previous.length ? Number(previous[i]?.[key]) || 0 : null,
    previousDate: previous[i]?.date || null,
  }));

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const weekdayOf = (date) => {
  const [y, m, d] = String(date).split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
};

export const longDay = (date) => {
  const [y, m, d] = String(date).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
