import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Printer, Mail, Loader2, ArrowUp, ArrowDown, AlertTriangle, CircleAlert, Info, ChevronRight, Sparkles } from "lucide-react";

import SkeletonCard from "../../components/common/SkeletonCard";
import { Panel, Legend, ChartTooltip, Donut, RankBars } from "../components/charts/ChartKit";
import { AXIS_TICK, GRID, SERIES, MUTED, formatDay } from "../components/charts/chartTokens";
import { getExecutiveReport, emailExecutiveReport } from "../services/automation.service";
import { countryFlag, formatDuration, compactNumber } from "../components/dashboard/format";

/* ========================================
   EXECUTIVE REPORT — a one-page summary of
   the period vs the previous one. Prints
   cleanly (Print → Save as PDF): the admin
   chrome and the toolbar are hidden.
========================================= */

const PERIODS = [
  ["week", "Last 7 days"],
  ["month", "Last 30 days"],
  ["quarter", "Last 90 days"],
];

const SOURCE_COLORS = { Direct: SERIES[0], Search: SERIES[1], Social: SERIES[2], Referral: SERIES[3], Card: MUTED };

const GRADE_COLORS = { Excellent: "#059669", Good: "#2a78d6", Fair: "#d97706", "Needs attention": "#dc2626" };

// lowerIsBetter: a drop is good news (e.g. bounce rate).
const KPI_LIST = [
  ["views", "Page views", (v) => compactNumber(v)],
  ["visitors", "Unique visitors", (v) => compactNumber(v)],
  ["sessions", "Sessions", (v) => compactNumber(v)],
  ["avgDurationMs", "Avg. visit length", (v) => formatDuration(v)],
  ["bounceRate", "Bounce rate", (v) => `${v}%`, true],
  ["pagesPerSession", "Pages / visit", (v) => v],
  ["messages", "Messages received", (v) => v],
  ["contactForms", "Contact form sends", (v) => v],
  ["downloads", "Downloads", (v) => v],
  ["cardOpens", "NFC card opens", (v) => v],
  ["cardSaves", "Contacts saved", (v) => v],
  ["comments", "Blog comments", (v) => v],
  ["postsPublished", "Posts published", (v) => v],
  ["notesEdited", "Notes worked on", (v) => v],
];

function Change({ change, lowerIsBetter }) {
  if (change === null) return <span className="text-xs text-muted">new</span>;
  if (!change) return <span className="text-xs text-muted">no change</span>;
  const good = lowerIsBetter ? change < 0 : change > 0;
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
      <Icon size={12} strokeWidth={2.5} />
      {Math.abs(change)}%
    </span>
  );
}

function ScoreRing({ score, grade }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = GRADE_COLORS[grade] || SERIES[0];
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`Health score ${score} out of 100, ${grade}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-surface)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-heading tabular-nums">{score}</span>
        <span className="text-xs font-medium" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

const PILLARS = [
  ["growth", "Growth", "Traffic vs the previous period"],
  ["engagement", "Engagement", "Visit length and bounce rate"],
  ["content", "Content", "Posts, notes and discussion"],
  ["responsiveness", "Responsiveness", "Replies, moderation, backups"],
];

const LEVEL = {
  high: ["text-red-500", CircleAlert, "High"],
  medium: ["text-amber-600", AlertTriangle, "Medium"],
  low: ["text-muted", Info, "Low"],
};

function ExecutiveReport() {
  const [params, setParams] = useSearchParams();
  const period = PERIODS.some(([p]) => p === params.get("period")) ? params.get("period") : "week";
  const [report, setReport] = useState(null);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExecutiveReport(period)
      .then((r) => !cancelled && setReport(r))
      .catch(() => !cancelled && toast.error("Couldn't build the report"));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const emailIt = async () => {
    try {
      setEmailing(true);
      await emailExecutiveReport(period);
      toast.success("Report emailed to you");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't email the report");
    } finally {
      setEmailing(false);
    }
  };

  const loading = !report || report.period !== period;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* toolbar (not printed) */}
      <section className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setParams({ period: value })}
              className={`h-control px-4 rounded-control border border-border text-small transition ${period === value ? "bg-primary text-background" : "bg-surface"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={emailIt} disabled={emailing || loading} className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2 disabled:opacity-50">
            {emailing ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Email me
          </button>
          <button type="button" onClick={() => window.print()} disabled={loading} className="h-control px-5 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2 disabled:opacity-50">
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </section>

      {loading ? (
        <SkeletonCard />
      ) : (
        <article className="space-y-6">
          {/* cover */}
          <header className="card">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={report.health.score} grade={report.health.grade} />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-small">Portfolio performance report</p>
                  <h1 className="text-heading mt-1">
                    {new Date(report.from).toLocaleDateString(undefined, { day: "numeric", month: "short" })} –{" "}
                    {new Date(report.to).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Compared with the previous {report.label} · generated {new Date(report.generatedAt).toLocaleString()} · {report.timezone}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {PILLARS.map(([key, label, hint]) => (
                    <div key={key} title={hint}>
                      <div className="flex justify-between text-xs">
                        <span>{label}</span>
                        <span className="text-muted tabular-nums">{report.health.parts[key]}/25</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full" style={{ width: `${(report.health.parts[key] / 25) * 100}%`, backgroundColor: SERIES[0] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* summary */}
          <Panel title={<span className="inline-flex items-center gap-2"><Sparkles size={18} /> Executive summary</span>}>
            <ul className="space-y-2.5">
              {report.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-body">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-chart-1)]" />
                  {h}
                </li>
              ))}
            </ul>
          </Panel>

          {/* KPIs */}
          <section className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 print:grid-cols-7">
            {KPI_LIST.map(([key, label, fmt, lowerIsBetter]) => {
              const m = report.kpis[key];
              return (
                <div key={key} className="rounded-2xl border border-border bg-[var(--color-card)] p-3 break-inside-avoid">
                  <p className="text-[11px] leading-tight text-muted">{label}</p>
                  <p className="mt-1 text-title tabular-nums">{fmt(m.value)}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    <Change change={m.change} lowerIsBetter={lowerIsBetter} />
                    <span className="text-[10px] text-muted tabular-nums">was {fmt(m.previous)}</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* traffic + funnel */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] print:grid-cols-[1.6fr_1fr]">
            <Panel
              title="Traffic trend"
              right={
                <Legend
                  items={[
                    { label: "Views", color: SERIES[0] },
                    { label: "Visitors", color: SERIES[1] },
                  ]}
                />
              }
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.series} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} />
                    <Area type="monotone" dataKey="views" name="Views" stroke={SERIES[0]} strokeWidth={2} fill="url(#rptViews)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke={SERIES[1]} strokeWidth={2} fill="none" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Visitor funnel" subtitle="From arrival to getting in touch">
              <div className="space-y-3">
                {report.funnel.map((step, i) => {
                  const top = Math.max(1, report.funnel[0].value);
                  return (
                    <div key={step.label}>
                      <div className="flex justify-between text-small">
                        <span>{step.label}</span>
                        <span className="tabular-nums">
                          {step.value} <span className="text-xs text-muted">· {Math.round((step.value / top) * 100)}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max((step.value / top) * 100, step.value ? 2 : 0)}%`, backgroundColor: `color-mix(in srgb, ${SERIES[0]} ${100 - i * 18}%, transparent)` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </section>

          {/* audience */}
          <section className="grid gap-6 lg:grid-cols-3 print:grid-cols-3">
            <Panel title="Traffic sources">
              <Donut data={report.sources} colorFor={(d) => SOURCE_COLORS[d.label] || MUTED} totalLabel="sessions" size={120} />
            </Panel>
            <Panel title="Top countries">
              <RankBars items={report.countries.map((c) => ({ key: c.code, label: `${countryFlag(c.code)} ${c.name}`, value: c.count }))} />
            </Panel>
            <Panel title="Devices">
              <Donut data={report.devices.map((d) => ({ label: d.device, count: d.count }))} colorFor={(d, i) => SERIES[i] || MUTED} totalLabel="sessions" size={120} />
            </Panel>
          </section>

          {/* content */}
          <section className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            <Panel title="Top pages">
              <RankBars items={report.topPages.map((p) => ({ key: p.path, label: p.path === "/" ? "Home" : p.path, value: p.views }))} />
            </Panel>
            <Panel title="Top blog posts">
              <RankBars items={report.topPosts.map((p) => ({ key: p.path, label: p.title, value: p.views }))} color={SERIES[2]} />
            </Panel>
          </section>

          {/* actions */}
          <Panel title="Action items" subtitle={report.actions.length ? "Highest priority first" : undefined}>
            {!report.actions.length ? (
              <p className="text-body">Nothing needs your attention. 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {[...report.actions]
                  .sort((a, b) => ["high", "medium", "low"].indexOf(a.level) - ["high", "medium", "low"].indexOf(b.level))
                  .map((a) => {
                    const [cls, Icon, label] = LEVEL[a.level] || LEVEL.low;
                    return (
                      <li key={a.text}>
                        <Link to={a.link} className="flex items-center gap-3 py-3 hover:opacity-80">
                          <Icon size={17} className={`shrink-0 ${cls}`} />
                          <span className="flex-1 text-small">{a.text}</span>
                          <span className={`text-xs ${cls}`}>{label}</span>
                          <ChevronRight size={15} className="text-muted print:hidden" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Panel>

          <p className="text-center text-xs text-muted">Suryanshu Verma · Portfolio performance report</p>
        </article>
      )}
    </div>
  );
}

export default ExecutiveReport;
