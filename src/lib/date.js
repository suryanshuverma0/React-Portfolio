/*
  Date helpers for public-facing timelines.

  The API stores experience dates as `YYYY-MM` month inputs, which Mongo
  saves as UTC midnight (e.g. 2025-01-01T00:00:00.000Z). Reading those in
  local time would shift them back a month for anyone west of UTC, so ISO
  values are read in UTC. Free-form fallback strings ("Jan 2025") are read
  in local time, which is how the Date constructor parses them.
*/

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ISO_PATTERN = /^\d{4}-\d{2}/;

export const toYearMonth = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : { year: value.getUTCFullYear(), month: value.getUTCMonth() };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return ISO_PATTERN.test(String(value))
    ? { year: date.getUTCFullYear(), month: date.getUTCMonth() }
    : { year: date.getFullYear(), month: date.getMonth() };
};

// "Jan 2025". Falls back to the raw value when it can't be parsed so a
// hand-written label is still shown rather than dropped.
export const formatMonthYear = (value) => {
  const parsed = toYearMonth(value);

  if (!parsed) return value ? String(value) : "";

  return `${MONTHS[parsed.month]} ${parsed.year}`;
};

const now = () => {
  const today = new Date();

  return { year: today.getFullYear(), month: today.getMonth() };
};

// Inclusive month count — Jan to Jun is 6 months, matching how CVs read.
export const monthsBetween = (start, end) => {
  const from = toYearMonth(start);
  const to = end ? toYearMonth(end) : now();

  if (!from || !to) return null;

  const months = (to.year - from.year) * 12 + (to.month - from.month) + 1;

  return months > 0 ? months : null;
};

export const formatDuration = (months) => {
  if (!months) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;

  const parts = [];

  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);

  return parts.join(" ");
};

export const formatExperienceRange = (experience) => {
  const current = experience.isCurrent || experience.current;

  const start = formatMonthYear(experience.startDate);
  const end = current ? "Present" : formatMonthYear(experience.endDate);

  return {
    start,
    end: end || "Present",
    current: Boolean(current || !experience.endDate),
    duration: formatDuration(
      monthsBetween(experience.startDate, current ? null : experience.endDate),
    ),
  };
};
