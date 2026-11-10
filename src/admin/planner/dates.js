/* Local-calendar date helpers for the planner. Days are "YYYY-MM-DD"
   strings in the owner's own timezone (mirrors the server's
   planner.logic.js). */

const DAY = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");

export const toDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const today = () => toDay(new Date());
export const parseDay = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return toDay(d);
};
export const diffDays = (a, b) => Math.round((parseDay(a) - parseDay(b)) / DAY);
export const weekday = (s) => parseDay(s).getDay();

export const weekKey = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt - yearStart) / DAY + 1) / 7);
  return `${dt.getUTCFullYear()}-W${pad(week)}`;
};
export const monthKey = (s) => s.slice(0, 7);
export const yearKey = (s) => s.slice(0, 4);

export const mondayOf = (s) => addDays(s, -((weekday(s) + 6) % 7));
export const weekDays = (s) => Array.from({ length: 7 }, (_, i) => addDays(mondayOf(s), i));
export const range = (from, to) => {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};
export const monthDays = (s) => {
  const first = `${monthKey(s)}-01`;
  const d = parseDay(first);
  const last = toDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return range(first, last);
};
// Calendar grid (Monday first) padded with neighbouring days.
export const monthGrid = (s) => {
  const days = monthDays(s);
  return range(mondayOf(days[0]), addDays(mondayOf(days[days.length - 1]), 6));
};
export const addMonths = (s, n) => {
  const d = parseDay(`${monthKey(s)}-01`);
  return toDay(new Date(d.getFullYear(), d.getMonth() + n, 1));
};

export const fmt = (s, opts) => parseDay(s).toLocaleDateString(undefined, opts);
export const dayLabel = (s) => {
  const t = today();
  if (s === t) return "Today";
  if (s === addDays(t, 1)) return "Tomorrow";
  if (s === addDays(t, -1)) return "Yesterday";
  return fmt(s, { weekday: "short", month: "short", day: "numeric" });
};
export const periodLabel = (scope, period) => {
  if (scope === "day") return dayLabel(period);
  if (scope === "week") return `Week ${Number(period.split("W")[1])}`;
  if (scope === "month") return fmt(`${period}-01`, { month: "long", year: "numeric" });
  if (scope === "year") return period;
  return "Someday";
};
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------- habits (mirror of the server) ---------- */

export const targetOf = (h) => (h.kind === "count" ? Math.max(1, h.target || 1) : 1);
export const isHit = (h, count = 0) => count >= targetOf(h);
export const isScheduledDay = (h, day) => {
  if (day < h.startDate) return false;
  const s = h.schedule || { type: "daily" };
  if (s.type === "weekdays") return (s.days || []).includes(weekday(day));
  if (s.type === "interval") return diffDays(day, h.startDate) % Math.max(1, s.every || 1) === 0;
  return true;
};
export const scheduleLabel = (h) => {
  const s = h.schedule || { type: "daily" };
  const days = [...(s.days || [])].sort();
  if (s.type === "weekdays") return days.join() === "1,2,3,4,5" ? "Weekdays" : days.map((d) => WEEKDAYS[d]).join(" · ");
  if (s.type === "weekly") return `${s.times}× a week`;
  if (s.type === "monthly") return `${s.times}× a month`;
  if (s.type === "interval") return `Every ${s.every} days`;
  return "Every day";
};

// Quota habits: how many days hit in the current week / month so far.
export const quotaProgress = (habit, countOf, day) => {
  const type = habit.schedule?.type;
  if (type !== "weekly" && type !== "monthly") return null;
  const key = type === "weekly" ? weekKey : monthKey;
  const span = range(addDays(day, type === "weekly" ? -6 : -30), day).filter((d) => key(d) === key(day) && d >= habit.startDate);
  return { done: span.filter((d) => isHit(habit, countOf(habit._id, d))).length, quota: habit.schedule.times };
};

