import { useId, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
  FileText,
  PenLine,
  Flame,
  Database,
  Nfc,
  NotebookPen,
} from "lucide-react";

import {
  SOURCE_COLORS,
  countryName,
  countryFlag,
  formatDuration,
  formatBytes,
  compactNumber,
} from "./format";

/* ========================================
   Dashboard widgets — same tokens, cards
   and chart palette as Analytics. Colour
   follows the entity (fixed maps), never
   rank; every multi-series chart carries a
   legend with values.
========================================= */

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

const AXIS_TICK = { fontSize: 11, fill: "var(--color-muted)" };

const formatDay = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-[var(--color-card)] px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-medium">{formatDay(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto pl-3 tabular-nums font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function CardHeader({ title, subtitle, to, linkLabel = "Details", right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h2 className="text-title">{title}</h2>
        {subtitle && <p className="text-small mt-1">{subtitle}</p>}
      </div>
      {right}
      {to && (
        <Link to={to} className="text-small text-primary hover:opacity-70 transition-opacity inline-flex items-center gap-1">
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

/* ---------- sparkline (inside KPI cards) ---------- */

// Plain SVG that scales to its box (no measuring), so it can never spill
// out of a card. The stroke stays crisp via non-scaling-stroke.
export function Sparkline({ data, dataKey, color }) {
  const id = useId().replace(/:/g, "");
  const values = data.map((d) => Number(d[dataKey]) || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 100;
  const H = 32;
  const step = W / Math.max(1, values.length - 1);
  const points = values.map((v, i) => [i * step, H - 3 - ((v - min) / range) * (H - 6)]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-10 w-full" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------- traffic: views + visitors ---------- */

export function TrafficChart({ viewsByDay, daily }) {
  const data = useMemo(() => {
    const visitors = new Map((daily || []).map((d) => [d.date, d.visitors]));
    return (viewsByDay || []).map((d) => ({ date: d.date, views: d.count, visitors: visitors.get(d.date) ?? 0 }));
  }, [viewsByDay, daily]);

  const totals = data.reduce((t, d) => ({ views: t.views + d.views, visitors: t.visitors + d.visitors }), { views: 0, visitors: 0 });

  return (
    <section className="card">
      <CardHeader
        title="Traffic — last 30 days"
        subtitle="Page views and unique visitors per day"
        to="/dashboard/analytics"
        linkLabel="Full analytics"
      />
      <div className="mb-4 flex flex-wrap gap-5 text-xs">
        {[
          ["Views", "var(--color-chart-1)", totals.views],
          ["Visitors", "var(--color-chart-2)", totals.visitors],
        ].map(([label, color, value]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
            <span className="text-muted tabular-nums">{compactNumber(value)}</span>
          </span>
        ))}
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} axisLine={false} tickLine={false} minTickGap={28} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-muted)", strokeDasharray: "3 3" }} />
            <Line type="monotone" dataKey="views" name="Views" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="visitors" name="Visitors" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ---------- sources donut ---------- */

export function SourcesCard({ sources, total }) {
  return (
    <section className="card">
      <CardHeader title="Traffic sources" subtitle="Sessions, last 7 days" />
      {!sources.length ? (
        <p className="text-body">No sessions in the last 7 days.</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={sources.length > 1 ? 2 : 0}
                  stroke="var(--color-card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {sources.map((s) => (
                    <Cell key={s.label} fill={SOURCE_COLORS[s.label] || "var(--color-muted)"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-title tabular-nums">{compactNumber(total)}</span>
              <span className="text-[11px] text-muted">sessions</span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-2.5">
            {sources.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-small">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLORS[s.label] || "var(--color-muted)" }} />
                <span className="flex-1 truncate">{s.label === "Card" ? "NFC card" : s.label}</span>
                <span className="text-muted tabular-nums">{s.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ---------- audience: devices + countries ---------- */

export function AudienceCard({ devices, countries }) {
  const max = Math.max(1, ...countries.map((c) => c.count));
  return (
    <section className="card">
      <CardHeader title="Audience" subtitle="Last 7 days" to="/dashboard/visitors" linkLabel="Visitors" />
      {!devices.length ? (
        <p className="text-body">No visitors yet.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
            {devices.map((d, i) => (
              <div
                key={d.device}
                className="h-full"
                style={{ width: `${d.percent}%`, backgroundColor: `var(--color-chart-${i + 1})` }}
                title={`${d.device}: ${d.percent}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {devices.map((d, i) => {
              const Icon = DEVICE_ICONS[d.device] || Monitor;
              return (
                <span key={d.device} className="inline-flex items-center gap-1.5 capitalize">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--color-chart-${i + 1})` }} />
                  <Icon size={13} className="text-muted" />
                  {d.device} <span className="text-muted tabular-nums">{d.percent}%</span>
                </span>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {countries.map((c) => (
              <div key={c.country} className="space-y-1">
                <div className="flex justify-between text-small">
                  <span className="truncate">
                    {countryFlag(c.country)} {countryName(c.country)}
                  </span>
                  <span className="text-muted tabular-nums">{c.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, backgroundColor: "var(--color-chart-1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- live visitors ---------- */

export function LiveCard({ live }) {
  return (
    <section className="card">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Live now
          </span>
        }
        subtitle={`${live.length} on the site · last 2 min`}
        to="/dashboard/visitors"
        linkLabel="All"
      />
      {!live.length ? (
        <p className="text-body">Nobody right now.</p>
      ) : (
        <ul className="space-y-1">
          {live.map((s) => {
            const Icon = DEVICE_ICONS[s.device] || Monitor;
            return (
              <li key={s.sessionId}>
                <Link to={`/dashboard/visitors/${s.sessionId}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                  <span className="text-xl leading-none">{countryFlag(s.location?.country)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium">
                      {[s.location?.city, s.location?.country && countryName(s.location.country)].filter(Boolean).join(", ") || "Unknown"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      <Icon size={11} className="inline -mt-0.5 mr-1" />
                      {s.isCard ? (
                        <span className="inline-flex items-center gap-1">
                          <Nfc size={11} /> on your card
                        </span>
                      ) : (
                        `on ${s.page || "/"}`
                      )}{" "}
                      · {formatDuration(s.durationMs)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- notes: stats + writing heatmap + recent ---------- */

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function WritingHeatmap({ heatmap }) {
  // Columns are weeks (Sun–Sat), oldest left, like a contribution graph.
  const weeks = useMemo(() => {
    if (!heatmap.length) return [];
    const [y, m, d] = heatmap[0].date.split("-").map(Number);
    const pad = new Date(y, m - 1, d).getDay();
    const cells = [...Array(pad).fill(null), ...heatmap];
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [heatmap]);

  const max = Math.max(1, ...heatmap.map((h) => h.count));
  const shade = (count) =>
    count === 0
      ? "var(--color-surface)"
      : `color-mix(in srgb, var(--color-chart-3) ${Math.round(30 + (count / max) * 70)}%, transparent)`;

  return (
    <div className="space-y-2">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="h-3 text-[9px] leading-3 text-muted">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) =>
              cell ? (
                <span
                  key={cell.date}
                  className="h-3 w-3 rounded-[3px]"
                  style={{ backgroundColor: shade(cell.count) }}
                  title={`${formatDay(cell.date)}: ${cell.count ? `${cell.count} edit${cell.count === 1 ? "" : "s"}` : "no writing"}`}
                />
              ) : (
                <span key={`pad-${di}`} className="h-3 w-3" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted">
        Less
        {[0, 0.35, 0.65, 1].map((s) => (
          <span key={s} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: s === 0 ? "var(--color-surface)" : `color-mix(in srgb, var(--color-chart-3) ${Math.round(30 + s * 70)}%, transparent)` }} />
        ))}
        More
      </div>
    </div>
  );
}

const relative = (date) => {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function NotesPanel({ notes }) {
  const stats = [
    ["Notes", compactNumber(notes.total), `${notes.notebooks} notebook${notes.notebooks === 1 ? "" : "s"}`],
    ["Words written", compactNumber(notes.words), `${notes.typed} typed notes`],
    ["Handwritten", compactNumber(notes.handwritten), `${compactNumber(notes.inkItems)} strokes & items`],
    ["Edited this week", compactNumber(notes.editedThisWeek), `${notes.pinned} pinned`],
  ];

  return (
    <section className="card">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <NotebookPen size={18} /> Notes
          </span>
        }
        subtitle="Your private notebook"
        to="/dashboard/notes"
        linkLabel="Open notes"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface/50 p-4">
            <p className="text-small">{label}</p>
            <p className="text-heading mt-1 tabular-nums">{value}</p>
            <p className="text-xs text-muted mt-1">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-label">Writing activity · 12 weeks</p>
            <span className={`inline-flex items-center gap-1 text-xs ${notes.streak ? "text-orange-500" : "text-muted"}`}>
              <Flame size={13} />
              {notes.streak ? `${notes.streak}-day streak` : "No streak yet"}
            </span>
          </div>
          <WritingHeatmap heatmap={notes.heatmap} />
        </div>

        <div>
          <p className="text-label mb-3">Recently edited</p>
          {!notes.recent.length ? (
            <p className="text-small">No notes yet — start one from the Notes page.</p>
          ) : (
            <ul className="space-y-1">
              {notes.recent.map((note) => {
                const Icon = note.kind === "handwritten" ? PenLine : FileText;
                return (
                  <li key={note._id}>
                    <Link to={`/dashboard/notes?note=${note._id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                      <Icon size={15} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-medium">{note.title}</span>
                        <span className="block truncate text-xs text-muted">{note.notebook}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{relative(note.updatedAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- system health ---------- */

export function SystemCard({ storage, card }) {
  const pct = storage?.percent ?? 0;
  const tone = pct >= 90 ? "#dc2626" : pct >= 70 ? "#d97706" : "#059669";

  return (
    <section className="card">
      <CardHeader title="System" subtitle="Storage and NFC card" />
      <div className="space-y-5">
        <Link to="/dashboard/storage" className="block space-y-2 rounded-xl hover:opacity-80">
          <div className="flex items-center justify-between text-small">
            <span className="inline-flex items-center gap-2">
              <Database size={15} className="text-muted" /> Database
            </span>
            <span className="tabular-nums text-muted">
              {storage ? `${formatBytes(storage.usedBytes)} / ${formatBytes(storage.limitBytes)}` : "—"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Database storage used">
            <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: tone }} />
          </div>
          <p className="text-xs text-muted">
            {pct}% used{storage?.notesBytes ? ` · notes take ${formatBytes(storage.notesBytes)}` : ""}
          </p>
        </Link>

        <Link to="/dashboard/card" className="flex items-center justify-between rounded-xl text-small hover:opacity-80">
          <span className="inline-flex items-center gap-2">
            <Nfc size={15} className="text-muted" /> NFC card
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs ${card?.isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
            <span className={`h-2 w-2 rounded-full ${card?.isEnabled ? "bg-emerald-500" : "bg-neutral-400"}`} />
            {card?.isEnabled ? "Live" : "Off"}
          </span>
        </Link>
        {card && (
          <p className="text-xs text-muted -mt-3">
            {card.opens7d} opens · {card.saves7d} saved your contact ({card.saveRate}%) this week
          </p>
        )}
      </div>
    </section>
  );
}
