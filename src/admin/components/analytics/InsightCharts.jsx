import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Send, Download, Mail, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";

import TrendDelta from "../ui/TrendDelta";

/* ========================================
   Shared chart plumbing — recessive grid and
   axes, themed tooltip, thin 2px lines,
   rounded bar ends. Multi-series charts use
   chart-1 / chart-2 (both pass 3:1 contrast in
   light and dark) and always carry a legend.
========================================= */

const AXIS_TICK = { fontSize: 11, fill: "var(--color-muted)" };
const GRID_STROKE = "var(--color-border)";

const formatDay = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatMs = (ms) => {
  if (!ms || ms < 1000) return "0s";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m ? `${m}m ${s % 60}s` : `${s}s`;
};

// Compact axis labels that never wrap: "45s", "1.5m", "2h".
const formatAxisMs = (ms) => {
  if (!ms) return "0";
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round((ms / 60000) * 10) / 10}m`;
  return `${Math.round((ms / 3600000) * 10) / 10}h`;
};

function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter = (v) => v }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-[var(--color-card)] px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-medium">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted">{entry.name}</span>
          <span className="ml-auto tabular-nums font-medium">{valueFormatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
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

function ChartCard({ title, subtitle, legend, children, height = "h-64" }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-title">{title}</h2>
          {subtitle && <p className="text-muted text-xs mt-1">{subtitle}</p>}
        </div>
        {legend}
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}

function EmptyState({ label }) {
  return <p className="text-body">{label}</p>;
}

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);

/* ========================================
   TRENDS
========================================= */

export function TrafficTrendChart({ daily }) {
  return (
    <ChartCard
      title="Traffic"
      subtitle="Page views and unique visitors per day"
      legend={
        <Legend
          items={[
            { label: "Views", color: "var(--color-chart-1)", value: sum(daily, "views") },
            { label: "Visitors", color: "var(--color-chart-2)", value: sum(daily, "visitors") },
          ]}
        />
      }
      height="h-72"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} minTickGap={24} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            content={<ChartTooltip labelFormatter={formatDay} />}
            cursor={{ stroke: "var(--color-muted)", strokeDasharray: "3 3" }}
          />
          <Line type="monotone" dataKey="views" name="Views" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="visitors" name="Visitors" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function NewVsReturningChart({ daily }) {
  return (
    <ChartCard
      title="New vs returning sessions"
      subtitle="Sessions per day, split by first-time and repeat visitors"
      legend={
        <Legend
          items={[
            { label: "New", color: "var(--color-chart-1)", value: sum(daily, "newSessions") },
            { label: "Returning", color: "var(--color-chart-2)", value: sum(daily, "returningSessions") },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} minTickGap={24} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} cursor={{ fill: "var(--color-surface)" }} />
          <Bar dataKey="newSessions" name="New" stackId="s" fill="var(--color-chart-1)" stroke="var(--color-card)" strokeWidth={1} />
          <Bar dataKey="returningSessions" name="Returning" stackId="s" fill="var(--color-chart-2)" stroke="var(--color-card)" strokeWidth={1} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EngagementTrendChart({ daily }) {
  const withSessions = daily.filter((d) => d.sessions > 0);
  const overall = withSessions.length
    ? withSessions.reduce((t, d) => t + d.avgActiveMs * d.sessions, 0) / sum(withSessions, "sessions")
    : 0;

  return (
    <ChartCard
      title="Engaged time"
      subtitle={`Average time actively viewing per session · overall ${formatMs(overall)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id="engagedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} minTickGap={24} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} tickFormatter={formatAxisMs} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            content={<ChartTooltip labelFormatter={formatDay} valueFormatter={formatMs} />}
            cursor={{ stroke: "var(--color-muted)", strokeDasharray: "3 3" }}
          />
          <Area type="monotone" dataKey="avgActiveMs" name="Engaged time" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#engagedFill)" activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HourlyChart({ hourly, timezone }) {
  const peak = hourly.reduce((best, h) => (h.sessions > best.sessions ? h : best), hourly[0]);
  const label = (hour) => `${String(hour).padStart(2, "0")}:00`;

  return (
    <ChartCard
      title="Traffic by hour"
      subtitle={
        peak?.sessions
          ? `Busiest around ${label(peak.hour)} · ${timezone}`
          : `Sessions started per hour · ${timezone}`
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hourly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="hour" tick={AXIS_TICK} tickFormatter={(h) => (h % 3 === 0 ? h : "")} interval={0} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip labelFormatter={label} />} cursor={{ fill: "var(--color-surface)" }} />
          <Bar dataKey="sessions" name="Sessions" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ========================================
   JOURNEY STAGES & CONVERSIONS
========================================= */

export function JourneyStages({ stages }) {
  const total = stages[0]?.count || 0;

  return (
    <div className="card">
      <h2 className="text-title mb-1">Visitor journey</h2>
      <p className="text-muted text-xs mb-5">How far sessions get through your portfolio</p>

      {!total ? (
        <EmptyState label="No sessions in this range yet." />
      ) : (
        <ol className="space-y-4">
          {stages.map((stage, index) => (
            <li key={stage.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-small">
                <span>
                  <span className="text-muted tabular-nums mr-2">{index + 1}</span>
                  {stage.label}
                  <span className="text-muted text-xs ml-2 hidden sm:inline">{stage.hint}</span>
                </span>
                <span className="tabular-nums shrink-0">
                  {stage.count} <span className="text-muted">· {stage.percent}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(stage.percent, stage.count ? 2 : 0)}%`,
                    backgroundColor: "var(--color-chart-1)",
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const CONVERSION_META = {
  form_submit: { label: "Contact form", icon: Send },
  contact_link: { label: "Email / phone clicks", icon: Mail },
  download: { label: "Downloads", icon: Download },
  outbound_click: { label: "Outbound clicks", icon: ExternalLink },
};

export function ConversionTiles({ conversions }) {
  return (
    <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {conversions.map((c) => {
        const meta = CONVERSION_META[c.type] || { label: c.type, icon: ExternalLink };
        const Icon = meta.icon;

        return (
          <div key={c.type} className="card glass-hover space-y-2">
            <p className="text-small inline-flex items-center gap-2">
              <Icon size={15} className="text-muted" />
              {meta.label}
            </p>
            <h2 className="text-heading tabular-nums">{c.current}</h2>
            <TrendDelta percent={c.changePercent} />
          </div>
        );
      })}
    </section>
  );
}

/* ========================================
   TABLES & LISTS
========================================= */

export function PageTable({ title, subtitle, rows, labelFor, emptyLabel }) {
  return (
    <div className="card">
      <h2 className="text-title mb-1">{title}</h2>
      <p className="text-muted text-xs mb-4">{subtitle}</p>

      {!rows.length ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="text-xs text-muted text-left border-b border-border">
                <th className="py-2 font-normal">Page</th>
                <th className="py-2 font-normal text-right">Views</th>
                <th className="py-2 font-normal text-right">Avg time</th>
                <th className="py-2 font-normal text-right">Scroll</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.path} className="border-b border-border last:border-b-0">
                  <td className="py-2.5 pr-3 max-w-[220px] truncate" title={row.path}>
                    {labelFor(row)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {row.views}
                    <span className="text-muted text-xs"> / {row.sessions}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatMs(row.avgTimeMs)}</td>
                  <td className="py-2.5 text-right tabular-nums">{row.avgScroll ? `${row.avgScroll}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted text-[11px] mt-2">Views / unique sessions</p>
        </div>
      )}
    </div>
  );
}

export function TimeOnPageList({ rows, labelFor }) {
  const max = Math.max(1, ...rows.map((r) => r.avgTimeMs));

  return (
    <div className="card">
      <h2 className="text-title mb-1">Time on page</h2>
      <p className="text-muted text-xs mb-5">Average visible time per page view</p>

      {!rows.length ? (
        <EmptyState label="No completed page visits yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.path} className="space-y-1.5" title={`${row.views} visits`}>
              <div className="flex justify-between gap-3 text-small">
                <span className="truncate">{labelFor(row)}</span>
                <span className="text-muted tabular-nums shrink-0">{formatMs(row.avgTimeMs)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max((row.avgTimeMs / max) * 100, 3)}%`, backgroundColor: "var(--color-chart-1)" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

export function DeviceEngagementTable({ rows }) {
  return (
    <div className="card">
      <h2 className="text-title mb-1">Engagement by device</h2>
      <p className="text-muted text-xs mb-4">How visits differ between desktop, mobile and tablet</p>

      {!rows.length ? (
        <EmptyState label="No sessions yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="text-xs text-muted text-left border-b border-border">
                <th className="py-2 font-normal">Device</th>
                <th className="py-2 font-normal text-right">Sessions</th>
                <th className="py-2 font-normal text-right">Avg time</th>
                <th className="py-2 font-normal text-right">Pages</th>
                <th className="py-2 font-normal text-right">Scroll</th>
                <th className="py-2 font-normal text-right">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const Icon = DEVICE_ICONS[row.device] || Monitor;
                return (
                  <tr key={row.device} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 capitalize">
                      <span className="inline-flex items-center gap-2">
                        <Icon size={15} className="text-muted" />
                        {row.device}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{row.sessions}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatMs(row.avgDurationMs)}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.avgPages}</td>
                    <td className="py-2.5 text-right tabular-nums">{row.avgScroll}%</td>
                    <td className="py-2.5 text-right tabular-nums">{row.bounceRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
