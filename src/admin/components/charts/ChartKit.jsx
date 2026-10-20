import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ========================================
   Small shared chart pieces for the blog
   analytics and executive report pages —
   same tokens and conventions as the rest
   of the admin (legend + values, colour by
   entity, recessive axes).
========================================= */

export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter = (v) => v }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-[var(--color-card)] px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-medium">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto pl-3 tabular-nums font-medium">{valueFormatter(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
          {item.value !== undefined && <span className="text-muted tabular-nums">{item.value}</span>}
        </span>
      ))}
    </div>
  );
}

export function Panel({ title, subtitle, right, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title">{title}</h2>
          {subtitle && <p className="text-small mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children = "No data in this period yet." }) {
  return <p className="text-body">{children}</p>;
}

// Donut with the total in the middle and a legend with percentages.
export function Donut({ data, colorFor, totalLabel = "total", size = 140 }) {
  const total = data.reduce((t, d) => t + d.count, 0);
  if (!total) return <Empty />;
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="var(--color-card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={colorFor(d, i)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-title tabular-nums">{total}</span>
          <span className="text-[11px] text-muted">{totalLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-small">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorFor(d, i) }} />
            <span className="flex-1 truncate capitalize">{d.label}</span>
            <span className="text-muted tabular-nums">{Math.round((d.count / total) * 1000) / 10}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal magnitude bars (one hue), used for ranked lists.
export function RankBars({ items, format = (v) => v, color = "var(--color-chart-1)" }) {
  if (!items.length) return <Empty />;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key || item.label} className="space-y-1.5" title={item.title}>
          <div className="flex justify-between gap-3 text-small">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 text-muted tabular-nums">{format(item.value, item)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full" style={{ width: `${Math.max((item.value / max) * 100, item.value ? 3 : 0)}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Weekday × hour heatmap (sequential single hue) with tooltips.
export function WeekHourHeatmap({ cells, timezone, unit = "views" }) {
  const map = new Map(cells.map((c) => [`${c.day}-${c.hour}`, c.count]));
  const max = Math.max(1, ...cells.map((c) => c.count));
  const fill = (n) => (n ? `color-mix(in srgb, var(--color-chart-1) ${Math.round(20 + (n / max) * 80)}%, transparent)` : "var(--color-surface)");
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="min-w-[520px] space-y-1">
          {DAYS.map((d, day) => (
            <div key={d} className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] items-center gap-[2px]">
              <span className="text-xs text-muted">{d}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const n = map.get(`${day}-${hour}`) || 0;
                return <div key={hour} className="h-4 rounded-[3px]" style={{ backgroundColor: fill(n) }} title={`${d} ${String(hour).padStart(2, "0")}:00 — ${n} ${unit}`} />;
              })}
            </div>
          ))}
          <div className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-muted">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center">
                {h % 3 === 0 ? h : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {timezone && <p className="text-xs text-muted">Times in {timezone}</p>}
    </div>
  );
}
