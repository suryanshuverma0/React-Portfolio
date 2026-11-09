import { useEffect, useId, useMemo, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus, Sparkles } from "lucide-react";

import { AXIS_TICK, GRID, formatDay } from "./chartTokens";
import { longDay } from "./periodMath";

/* ========================================
   ANALYTICS VISUALS — shared by Dashboard,
   Analytics, Visitors and Blog analytics so
   every KPI and chart speaks one language.

   Conventions (see the dataviz rules):
   - colour by entity, chart-1…4 in order;
   - one axis per chart; the previous period
     is a dashed muted line, not a 2nd axis;
   - every mark has a hover readout;
   - text is ink colour, never series colour;
   - change is arrow + number + words, never
     colour alone, and knows whether up is
     good (bounce rate down = good).
========================================= */

/* ---------- animated number ---------- */

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString() }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce || typeof value !== "number") return undefined;
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  if (typeof value !== "number") return <>{value}</>;
  return <>{format(reduce ? value : shown)}</>;
}

/* ---------- delta pill ---------- */

export function DeltaPill({ value, label, goodWhen = "up", unit = "%", isNew = false }) {
  if (isNew) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
        <Sparkles size={11} /> New{label && <span className="font-normal text-muted"> {label}</span>}
      </span>
    );
  }
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const flat = value === 0;
  const up = value > 0;
  const good = flat ? null : (up && goodWhen === "up") || (!up && goodWhen === "down");
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums ${
          flat
            ? "bg-surface text-muted"
            : good
              ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/12 text-red-600 dark:text-red-400"
        }`}
      >
        <Icon size={12} strokeWidth={2.5} />
        {flat ? "0" : `${Math.abs(value)}${unit}`}
      </span>
      {label && <span className="text-muted">{label}</span>}
    </span>
  );
}

/* ---------- sparkline (hoverable) ---------- */

function SparkTooltip({ active, payload, format }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] shadow-lg">
      <span className="text-muted">{row.date ? longDay(row.date) : ""}</span>
      <span className="ml-2 font-semibold tabular-nums">{format(payload[0].value)}</span>
    </div>
  );
}

export function SparkArea({ data, dataKey, color, format = (v) => Math.round(v).toLocaleString(), height = 44 }) {
  const id = useId().replace(/:/g, "");
  if (!data?.length || data.length < 2) return <div style={{ height }} />;

  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            content={<SparkTooltip format={format} />}
            cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            allowEscapeViewBox={{ x: false, y: true }}
            wrapperStyle={{ outline: "none", zIndex: 20 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            dot={false}
            activeDot={{ r: 3.5, stroke: "var(--color-card)", strokeWidth: 2 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- radial gauge ---------- */

// Semicircle gauge for a 0–100 rate. `goodWhen` only affects the caption.
export function RadialGauge({ value, color = "var(--color-chart-1)", size = 120, label, caption, showValue = true }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 44;
  const arc = Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 110 62" width={size} height={(size * 62) / 110} aria-label={`${label || "Rate"} ${clamped}%`} role="img">
        <path d="M 11 55 A 44 44 0 0 1 99 55" fill="none" stroke="var(--color-surface)" strokeWidth="9" strokeLinecap="round" />
        <motion.path
          d="M 11 55 A 44 44 0 0 1 99 55"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={arc}
          initial={{ strokeDashoffset: reduce ? arc * (1 - clamped / 100) : arc }}
          animate={{ strokeDashoffset: arc * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        {showValue && <text x="55" y="50" textAnchor="middle" className="fill-[var(--color-primary)]" style={{ fontSize: 17, fontWeight: 650 }}>
          {Math.round(clamped * 10) / 10}%
        </text>}
      </svg>
      {caption && <p className="mt-1 text-center text-[11px] text-muted">{caption}</p>}
    </div>
  );
}

/* ---------- KPI card ---------- */

export function KpiCard({
  icon: Icon,
  label,
  value,
  format,
  delta,
  deltaLabel = "vs previous",
  deltaUnit = "%",
  isNew = false,
  goodWhen = "up",
  spark,
  sparkKey,
  sparkFormat,
  gauge,
  accent = "var(--color-chart-1)",
  hint,
  live = false,
  onClick,
  index = 0,
  className = "",
}) {
  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={`card group relative flex w-full flex-col overflow-hidden text-left transition-shadow hover:shadow-lg ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* soft accent glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-90"
        style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
            >
              <Icon size={17} strokeWidth={2} />
            </span>
          )}
          <p className="text-small leading-tight">{label}</p>
        </div>
        {live && (
          <span className="relative mt-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">
            <AnimatedNumber value={value} format={format} />
          </p>
          <div className="mt-2 min-h-5">
            <DeltaPill value={delta} label={deltaLabel} goodWhen={goodWhen} unit={deltaUnit} isNew={isNew} />
          </div>
        </div>
        {typeof gauge === "number" && <RadialGauge value={gauge} color={accent} size={84} label={label} showValue={false} />}
      </div>

      {spark?.length > 1 && (
        <div className="relative mt-2">
          <SparkArea data={spark} dataKey={sparkKey} color={accent} format={sparkFormat || format || ((v) => Math.round(v).toLocaleString())} />
        </div>
      )}

      {hint && <p className="relative mt-2 text-xs text-muted">{hint}</p>}
    </Wrapper>
  );
}

/* ---------- range tabs ---------- */

export function RangeTabs({ value, onChange, options }) {
  const id = useId();
  return (
    <div className="inline-flex rounded-control border border-border bg-surface p-1" role="tablist" aria-label="Date range">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative h-9 rounded-[14px] px-3.5 text-sm transition-colors ${active ? "text-background font-medium" : "text-secondary hover:text-primary"}`}
          >
            {active && (
              <motion.span
                layoutId={`range-${id}`}
                className="absolute inset-0 rounded-[14px] bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- period comparison ---------- */

function CompareTooltip({ active, payload, format, metricLabel }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const change = row.previous ? Math.round(((row.current - row.previous) / row.previous) * 1000) / 10 : null;
  return (
    <div className="min-w-44 space-y-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{metricLabel}</p>
      <p className="flex items-center gap-2">
        <span className="h-0.5 w-3 rounded bg-[var(--color-chart-1)]" />
        <span className="text-muted">{longDay(row.date)}</span>
        <span className="ml-auto pl-3 font-semibold tabular-nums">{format(row.current)}</span>
      </p>
      {row.previous !== null && (
        <p className="flex items-center gap-2">
          <span className="h-0 w-3 border-t-2 border-dashed border-[var(--color-muted)]" />
          <span className="text-muted">{row.previousDate ? longDay(row.previousDate) : "Previous"}</span>
          <span className="ml-auto pl-3 tabular-nums text-secondary">{format(row.previous)}</span>
        </p>
      )}
      {change !== null && (
        <p className="border-t border-border pt-1.5">
          <DeltaPill value={change} label="vs same day before" />
        </p>
      )}
    </div>
  );
}

// metrics: [{ key, label, data: [{date,current,previous,previousDate}], total, previousTotal, format }]
export function PeriodCompareChart({ metrics, rangeLabel }) {
  const [active, setActive] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === active) || metrics[0];
  const id = useId().replace(/:/g, "");
  const format = metric?.format || ((v) => Math.round(v).toLocaleString());
  const hasPrevious = metric?.data.some((d) => d.previous !== null);
  const change = hasPrevious && metric.previousTotal ? Math.round(((metric.total - metric.previousTotal) / metric.previousTotal) * 1000) / 10 : null;

  if (!metric) return null;

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title">Performance over time</h2>
          <p className="text-small mt-1">This {rangeLabel} against the {rangeLabel} before it</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Metric">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={m.key === metric.key}
              onClick={() => setActive(m.key)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                m.key === metric.key ? "border-primary bg-surface" : "border-border hover:border-border-strong"
              }`}
            >
              <span className="block text-[11px] text-muted">{m.label}</span>
              <span className="block text-sm font-semibold tabular-nums">{(m.format || ((v) => Math.round(v).toLocaleString()))(m.total)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-[var(--color-chart-1)]" /> This period
        </span>
        {hasPrevious && (
          <span className="inline-flex items-center gap-2 text-secondary">
            <span className="h-0 w-4 border-t-2 border-dashed border-[var(--color-muted)]" /> Previous period
          </span>
        )}
        {change !== null && <DeltaPill value={change} label={`${metric.label.toLowerCase()} overall`} goodWhen={metric.goodWhen || "up"} />}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metric.data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={`cmp-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDay} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => (metric.axisFormat || format)(v)} allowDecimals={false} />
            <Tooltip content={<CompareTooltip format={format} metricLabel={metric.label} />} cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }} />
            {hasPrevious && (
              <Line type="monotone" dataKey="previous" name="Previous period" stroke="var(--color-muted)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 3 }} animationDuration={600} />
            )}
            <Area
              type="monotone"
              dataKey="current"
              name="This period"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill={`url(#cmp-${id})`}
              dot={false}
              activeDot={{ r: 4.5, stroke: "var(--color-card)", strokeWidth: 2 }}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ---------- calendar heatmap ---------- */

const parseDay = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// GitHub-style: one column per week, one row per weekday. Shading uses
// quartiles of the active days, so one viral day doesn't wash out the rest.
export function CalendarHeatmap({ daily, valueKey = "views", unit = "views", title = "Daily activity", subtitle }) {
  const [hover, setHover] = useState(null);

  const model = useMemo(() => {
    const rows = daily || [];
    if (!rows.length) return null;

    const value = (r) => Number(r[valueKey]) || 0;
    const lead = parseDay(rows[0].date).getDay();
    const cells = [...Array(lead).fill(null), ...rows];
    while (cells.length % 7) cells.push(null);
    const weeks = cells.length / 7;

    const active = rows.map(value).filter(Boolean).sort((a, b) => a - b);
    const q = (p) => active[Math.min(active.length - 1, Math.floor(p * active.length))] || 0;
    const cuts = [q(0.25), q(0.5), q(0.75)];
    const level = (v) => (!v ? 0 : v <= cuts[0] ? 1 : v <= cuts[1] ? 2 : v <= cuts[2] ? 3 : 4);

    let streak = 0;
    let best = 0;
    rows.forEach((r) => {
      streak = value(r) ? streak + 1 : 0;
      best = Math.max(best, streak);
    });

    const total = active.reduce((a, b) => a + b, 0);
    const top = rows.reduce((b, r) => (value(r) > (b ? value(b) : 0) ? r : b), null);

    return { cells, weeks, level, value, total, top, activeDays: active.length, days: rows.length, longestStreak: best, avgActive: active.length ? total / active.length : 0 };
  }, [daily, valueKey]);

  const FILL = [
    "var(--color-surface)",
    "color-mix(in srgb, var(--color-chart-1) 30%, var(--color-surface))",
    "color-mix(in srgb, var(--color-chart-1) 52%, var(--color-surface))",
    "color-mix(in srgb, var(--color-chart-1) 76%, var(--color-surface))",
    "var(--color-chart-1)",
  ];

  return (
    <section className="card flex flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title">{title}</h2>
          <p className="text-small mt-1">{subtitle || (model ? `${model.total.toLocaleString()} ${unit} across ${model.days} days` : "")}</p>
        </div>
        <p className="min-h-5 text-xs text-secondary tabular-nums" aria-live="polite">
          {hover
            ? `${longDay(hover.date)} — ${model.value(hover).toLocaleString()} ${unit}`
            : model?.top && model.value(model.top)
              ? `Best day: ${longDay(model.top.date)} (${model.value(model.top).toLocaleString()})`
              : ""}
        </p>
      </div>

      {model ? (
        <>
          <div className="flex gap-2" onMouseLeave={() => setHover(null)}>
            <div className="grid shrink-0 grid-rows-7 gap-[3px] text-[10px] leading-none text-muted">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="flex items-center">{d}</span>
              ))}
            </div>
            <div
              className="grid flex-1 grid-flow-col gap-[3px]"
              style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))", gridTemplateColumns: `repeat(${model.weeks}, minmax(0, 1fr))` }}
            >
              {model.cells.map((cell, i) =>
                cell ? (
                  <button
                    key={cell.date}
                    type="button"
                    onMouseEnter={() => setHover(cell)}
                    onFocus={() => setHover(cell)}
                    className="aspect-square w-full max-w-4 rounded-[3px] transition-transform hover:scale-125"
                    style={{ backgroundColor: FILL[model.level(model.value(cell))] }}
                    aria-label={`${longDay(cell.date)}: ${model.value(cell)} ${unit}`}
                  />
                ) : (
                  <span key={`pad-${i}`} className="aspect-square w-full max-w-4" />
                ),
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted">
            Less
            {FILL.map((f, i) => (
              <span key={i} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: f }} />
            ))}
            More
          </div>

          <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-4">
            {[
              ["Active days", `${model.activeDays} / ${model.days}`],
              [`Avg / active day`, Math.round(model.avgActive).toLocaleString()],
              ["Longest streak", `${model.longestStreak} day${model.longestStreak === 1 ? "" : "s"}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] text-muted">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="text-body">No activity in this period yet.</p>
      )}
    </section>
  );
}

/* ---------- highlights ---------- */

// items: [{ icon, title, detail, tone: "up" | "down" | "neutral" }]
export function Highlights({ items, title = "Highlights" }) {
  return (
    <section className="card">
      <h2 className="text-title flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--color-chart-4)]" /> {title}
      </h2>
      <p className="text-small mt-1 mb-4">Worked out from this period&apos;s numbers</p>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 rounded-xl border border-border bg-surface/50 p-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.tone === "up"
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      : item.tone === "down"
                        ? "bg-red-500/12 text-red-600 dark:text-red-400"
                        : "bg-background text-secondary"
                  }`}
                >
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.title}</span>
                  {item.detail && <span className="block text-xs text-muted">{item.detail}</span>}
                </span>
              </motion.li>
            );
          })}
        </ul>
      ) : (
        <p className="text-body">Not enough data yet.</p>
      )}
    </section>
  );
}
