import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Footprints,
  Eye,
  Users,
  Activity,
  Timer,
  Layers,
  LogOut,
  Repeat,
  Radio,
  Send,
  Download,
  Mail,
  ExternalLink,
  CalendarDays,
  Clock,
  Compass,
  Globe2,
  MonitorSmartphone,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { getAnalyticsOverview, getAdvancedInsights } from "../services/analytics.service";
import {
  NewVsReturningChart,
  EngagementTrendChart,
  HourlyChart,
  JourneyStages,
  PageTable,
  TimeOnPageList,
  DeviceEngagementTable,
} from "../components/analytics/InsightCharts";
import { Panel, Donut, RankBars } from "../components/charts/ChartKit";
import { SERIES, MUTED } from "../components/charts/chartTokens";
import { KpiCard, RangeTabs, PeriodCompareChart, CalendarHeatmap, Highlights } from "../components/charts/Visuals";
import { splitPeriods, sum, weightedAvg, pctChange, pointChange, ratio, alignPeriods, longDay } from "../components/charts/periodMath";
import { countryFlag, countryName, formatDuration } from "../components/dashboard/format";
import WorldMap from "../components/visitors/WorldMap";

/* ========================================
   ANALYTICS — traffic on the public site.

   KPIs carry sparklines and honest deltas
   against the previous period (computed from
   a longer daily series, so every metric is
   compared like for like). Breakdowns are
   donuts/bars with fixed entity colours.
========================================= */

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// Fixed per-entity colours: an entity keeps its colour whatever its rank.
const DEVICE_COLORS = { desktop: SERIES[0], mobile: SERIES[1], tablet: SERIES[2] };
const SOURCE_COLORS = { Direct: SERIES[0], Search: SERIES[1], Social: SERIES[2], Referral: SERIES[3] };
const NEW_RETURNING_COLORS = { New: SERIES[0], Returning: SERIES[1] };

// Open-ended sets (browsers, OS): the top four keep a colour, everything
// else folds into one muted "Other" — never several identical greys.
const foldTop = (items = [], limit = 4) => {
  const named = items.filter((i) => i.label && i.label !== "Other").sort((a, b) => b.count - a.count);
  const rest = items.filter((i) => !i.label || i.label === "Other").concat(named.slice(limit));
  const other = rest.reduce((t, i) => t + i.count, 0);
  return [...named.slice(0, limit), ...(other ? [{ label: "Other", count: other }] : [])];
};
const rankColor = (item, index) => (item.label === "Other" ? MUTED : SERIES[index] || MUTED);

const CONVERSION_META = {
  form_submit: { label: "Contact form sent", icon: Send, accent: SERIES[0] },
  download: { label: "Downloads", icon: Download, accent: SERIES[2] },
  contact_link: { label: "Email / phone clicks", icon: Mail, accent: SERIES[1] },
  outbound_click: { label: "Outbound clicks", icon: ExternalLink, accent: SERIES[3] },
};

const LANGUAGE_NAMES = typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "language" }) : null;
const languageName = (code) => {
  try {
    return LANGUAGE_NAMES?.of(code) || code;
  } catch {
    return code;
  }
};

const slugTitle = (slug) => slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const pageName = (path) => {
  if (!path || path === "/") return "Home";
  if (path === "/blog") return "Blog";
  if (path.startsWith("/projects/")) return `Project · ${slugTitle(path.slice(10))}`;
  if (path.startsWith("/blog/")) return `Post · ${slugTitle(path.slice(6))}`;
  return path;
};

const oneDecimal = (v) => (Math.round(v * 10) / 10).toFixed(1);
const percentOf = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);

function Analytics() {
  const [range, setRange] = useState(30);
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAnalyticsOverview(range), getAdvancedInsights(range).catch(() => null)])
      .then(([data, deeper]) => {
        if (cancelled) return;
        setOverview(data);
        setInsights(deeper);
      })
      .catch(() => !cancelled && toast.error("Failed to load analytics"));

    // A longer daily series for previous-period comparisons and the
    // calendar — additive, the page works without it.
    getAdvancedInsights(Math.min(365, Math.max(range * 2, 182)))
      .then((data) => !cancelled && setComparison(data))
      .catch(() => !cancelled && setComparison(null));

    return () => {
      cancelled = true;
    };
  }, [range]);

  const model = useMemo(() => {
    if (!overview) return null;

    const daily = insights?.daily || (overview.viewsByDay || []).map((d) => ({ date: d.date, views: d.count, visitors: 0, sessions: 0 }));
    const { previous } = splitPeriods(comparison?.daily || [], range);
    const current = daily;
    const hasPrev = previous.length === range;

    // Session-level tracking started later than page views; only compare
    // a metric when the previous period actually has data for it.
    const prevFor = (key) => (hasPrev && sum(previous, key) > 0 ? previous : []);
    const firstSession = (comparison?.daily || []).find((d) => d.sessions > 0)?.date;
    const sessionsTracked = hasPrev && sum(previous, "sessions") > 0;
    const trackingNote = !sessionsTracked && firstSession ? `Session tracking began ${longDay(firstSession)}` : undefined;

    const sessions = sum(current, "sessions");
    const prevSessions = sessionsTracked ? sum(previous, "sessions") : null;
    const engaged = weightedAvg(current, "avgActiveMs", "sessions");
    const prevEngaged = sessionsTracked ? weightedAvg(previous, "avgActiveMs", "sessions") : null;
    const pps = ratio(sum(current, "views"), sessions);
    const prevPps = sessionsTracked ? ratio(sum(previous, "views"), prevSessions) : null;
    const returningShare = percentOf(sum(current, "returningSessions"), sessions);
    const prevReturningShare = sessionsTracked ? percentOf(sum(previous, "returningSessions"), prevSessions) : null;

    const deviceRows = insights?.deviceEngagement || [];
    const bounce = Math.round(weightedAvg(deviceRows, "bounceRate", "sessions") * 10) / 10;

    const withRatio = current.map((d) => ({ ...d, pps: d.sessions ? d.views / d.sessions : 0 }));

    const compareMetrics = [
      { key: "views", label: "Views", data: alignPeriods(current, prevFor("views"), "views"), total: overview.totalViews ?? sum(current, "views"),
        // Derived from the server's own comparison so this chart and the KPI
        // card always show the same % change.
        previousTotal:
          typeof overview.trend?.viewsChangePercent === "number" && overview.totalViews
            ? overview.totalViews / (1 + overview.trend.viewsChangePercent / 100)
            : prevFor("views").length
              ? sum(previous, "views")
              : null,
      },
      { key: "sessions", label: "Sessions", data: alignPeriods(current, prevFor("sessions"), "sessions"), total: sessions, previousTotal: prevSessions },
      {
        key: "visitors",
        label: "Visitors / day",
        data: alignPeriods(current, prevFor("visitors"), "visitors"),
        total: current.length ? sum(current, "visitors") / current.length : 0,
        previousTotal: prevFor("visitors").length ? sum(previous, "visitors") / previous.length : null,
        format: oneDecimal,
        axisFormat: (v) => Math.round(v),
      },
      {
        key: "engaged",
        label: "Engaged time",
        data: alignPeriods(current, prevFor("avgActiveMs"), "avgActiveMs"),
        total: engaged,
        previousTotal: prevEngaged,
        format: formatDuration,
        axisFormat: (v) => `${Math.round(v / 1000)}s`,
      },
    ];

    return {
      daily: current,
      withRatio,
      trackingNote,
      hasPrev,
      sessions,
      sessionsDelta: pctChange(sessions, prevSessions),
      engaged,
      engagedDelta: pctChange(engaged, prevEngaged),
      pps,
      ppsDelta: pctChange(pps, prevPps),
      returningShare,
      returningDelta: pointChange(returningShare, prevReturningShare),
      bounce,
      compareMetrics,
      calendar: comparison?.daily || current,
    };
  }, [overview, insights, comparison, range]);

  const highlights = useMemo(() => {
    if (!overview || !model) return [];
    const items = [];
    const viewsDelta = overview.trend?.viewsChangePercent;

    if (typeof viewsDelta === "number" && viewsDelta !== 0) {
      items.push({
        icon: viewsDelta > 0 ? TrendingUp : TrendingDown,
        tone: viewsDelta > 0 ? "up" : "down",
        title: `Views ${viewsDelta > 0 ? "up" : "down"} ${Math.abs(viewsDelta)}%`,
        detail: `Compared with the previous ${range} days`,
      });
    }

    const best = model.daily.reduce((b, d) => ((d.views || 0) > (b?.views || 0) ? d : b), null);
    if (best?.views) items.push({ icon: CalendarDays, tone: "neutral", title: `Busiest day: ${longDay(best.date)}`, detail: `${best.views} views that day` });

    const peak = (insights?.hourly || []).reduce((b, h) => (h.sessions > (b?.sessions || 0) ? h : b), null);
    if (peak?.sessions) {
      const h = String(peak.hour).padStart(2, "0");
      items.push({ icon: Clock, tone: "neutral", title: `Peak hour: ${h}:00–${String((peak.hour + 1) % 24).padStart(2, "0")}:00`, detail: `${peak.sessions} sessions start then (${insights.timezone})` });
    }

    const topSource = [...(overview.referrerSources || [])].sort((a, b) => b.count - a.count)[0];
    if (topSource?.count) items.push({ icon: Compass, tone: "neutral", title: `${topSource.label} brings ${topSource.percent}% of traffic`, detail: "Biggest traffic source" });

    const topCountry = overview.topCountries?.[0];
    if (topCountry?.count) {
      const total = overview.topCountries.reduce((t, c) => t + c.count, 0);
      items.push({ icon: Globe2, tone: "neutral", title: `${countryFlag(topCountry.country)} ${countryName(topCountry.country)} leads`, detail: `${percentOf(topCountry.count, total)}% of located visitors` });
    }

    const devices = [...(insights?.deviceEngagement || [])].filter((d) => d.sessions >= 3).sort((a, b) => b.avgDurationMs - a.avgDurationMs);
    if (devices.length > 1) {
      items.push({ icon: MonitorSmartphone, tone: "neutral", title: `${devices[0].device[0].toUpperCase()}${devices[0].device.slice(1)} visitors stay longest`, detail: `${formatDuration(devices[0].avgDurationMs)} per session vs ${formatDuration(devices.at(-1).avgDurationMs)} on ${devices.at(-1).device}` });
    }

    return items.slice(0, 6);
  }, [overview, insights, model, range]);

  if (!overview || !model) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-full bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card h-44" />
          ))}
        </div>
        <div className="card h-96" />
      </div>
    );
  }

  const rangeWord = `${range} days`;
  const vsLabel = `vs prev. ${range}d`;

  const newVsReturning = [
    { label: "New", count: overview.newVsReturning?.new || 0 },
    { label: "Returning", count: overview.newVsReturning?.returning || 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading">Analytics</h1>
          <p className="text-body mt-3">
            Real traffic on your public portfolio.{" "}
            <Link to="/dashboard/visitors" className="inline-flex items-center gap-1 underline underline-offset-2">
              <Footprints size={14} /> See individual visitor journeys
            </Link>
          </p>
        </div>
        <RangeTabs value={range} onChange={setRange} options={RANGES} />
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} icon={Eye} label="Page views" value={overview.totalViews} delta={overview.trend?.viewsChangePercent} deltaLabel={vsLabel} spark={model.daily} sparkKey="views" accent={SERIES[0]} hint={`${oneDecimal(overview.totalViews / range)} per day on average`} />
        <KpiCard index={1} icon={Users} label="Unique visitors" value={overview.uniqueVisitors} delta={overview.trend?.visitorsChangePercent} deltaLabel={vsLabel} spark={model.daily} sparkKey="visitors" accent={SERIES[2]} />
        <KpiCard index={2} icon={Activity} label="Sessions" value={model.sessions} delta={model.sessionsDelta} deltaLabel={vsLabel} spark={model.daily} sparkKey="sessions" accent={SERIES[1]} hint={model.trackingNote} />
        <KpiCard
          index={3}
          icon={Timer}
          label="Engaged time / session"
          value={model.engaged}
          format={formatDuration}
          delta={model.engagedDelta}
          deltaLabel={vsLabel}
          spark={model.daily}
          sparkKey="avgActiveMs"
          accent={SERIES[3]}
          hint={model.trackingNote}
        />
        <KpiCard index={4} icon={Layers} label="Pages per session" value={model.pps} format={oneDecimal} delta={model.ppsDelta} deltaLabel={vsLabel} spark={model.withRatio} sparkKey="pps" accent={SERIES[0]} />
        <KpiCard index={5} icon={LogOut} label="Bounce rate" value={model.bounce} format={(v) => `${oneDecimal(v)}%`} gauge={model.bounce} goodWhen="down" accent={SERIES[1]} hint="One page, under 10 seconds" />
        <KpiCard
          index={6}
          icon={Repeat}
          label="Returning sessions"
          value={model.returningShare}
          format={(v) => `${oneDecimal(v)}%`}
          gauge={model.returningShare}
          delta={model.returningDelta}
          deltaUnit=" pts"
          deltaLabel={vsLabel}
          accent={SERIES[2]}
          hint="Share of sessions from people who'd visited before"
        />
        <KpiCard index={7} icon={Radio} label="Active right now" value={overview.activeNow ?? 0} live accent={SERIES[3]} hint="Visitors in the last 5 minutes" />
      </section>

      {/* Goals */}
      {insights?.conversions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-title">Goals</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {insights.conversions.map((c, i) => {
              const meta = CONVERSION_META[c.type] || { label: c.type, icon: Send, accent: SERIES[0] };
              return (
                <KpiCard
                  key={c.type}
                  index={i}
                  icon={meta.icon}
                  label={meta.label}
                  value={c.current}
                  delta={pctChange(c.current, c.previous)}
                  isNew={!c.previous && c.current > 0}
                  deltaLabel={vsLabel}
                  accent={meta.accent}
                  hint={`${c.previous} in the previous ${range} days`}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Trend + highlights */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PeriodCompareChart key={range} metrics={model.compareMetrics} rangeLabel={rangeWord} />
        <Highlights items={highlights} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <CalendarHeatmap daily={model.calendar} valueKey="views" unit="views" title="Daily views" />
        {insights && <HourlyChart hourly={insights.hourly} timezone={insights.timezone} />}
      </section>

      {/* Audience mix */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Traffic sources">
          <Donut data={overview.referrerSources || []} colorFor={(d) => SOURCE_COLORS[d.label] || MUTED} totalLabel="views" />
        </Panel>
        <Panel title="Devices">
          <Donut data={overview.deviceBreakdown || []} colorFor={(d) => DEVICE_COLORS[d.label] || MUTED} totalLabel="views" />
        </Panel>
        <Panel title="New vs returning">
          <Donut data={newVsReturning} colorFor={(d) => NEW_RETURNING_COLORS[d.label]} totalLabel="visitors" />
        </Panel>
      </section>

      {insights && (
        <section className="grid gap-6 lg:grid-cols-2">
          <NewVsReturningChart daily={insights.daily} />
          <EngagementTrendChart daily={insights.daily} />
        </section>
      )}

      {/* Geography */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Where visitors are" subtitle="Views by country in this period">
          <WorldMap countryCounts={(overview.topCountries || []).map((c) => ({ label: c.country, count: c.count }))} />
        </Panel>
        <Panel title="Top countries">
          <RankBars
            items={(overview.topCountries || []).map((c) => ({ key: c.country || "unknown", label: `${countryFlag(c.country)} ${countryName(c.country)}`, value: c.count }))}
          />
        </Panel>
      </section>

      {insights && (
        <section className="grid gap-6 lg:grid-cols-2">
          <JourneyStages stages={insights.stages} />
          <Panel title="Where visitors go next" subtitle="Outbound link clicks by destination">
            <RankBars items={(insights.outboundDestinations || []).map((d) => ({ key: d.host || d.label, label: d.label, value: d.count }))} color={SERIES[3]} />
          </Panel>
        </section>
      )}

      {insights && (
        <section className="grid gap-6 lg:grid-cols-2">
          <PageTable title="Top projects" subtitle="Project pages by views, time spent and scroll depth" rows={insights.topProjects} labelFor={(row) => slugTitle(row.slug)} emptyLabel="No project pages viewed yet." />
          <PageTable title="Top blog posts" subtitle="Posts by views, read time and scroll depth" rows={insights.topPosts} labelFor={(row) => slugTitle(row.slug)} emptyLabel="No blog posts read yet." />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top pages">
          <RankBars items={(overview.topPages || []).map((p) => ({ key: p.path, label: pageName(p.path), title: p.path, value: p.count }))} />
        </Panel>
        <Panel title="Top referrers" subtitle="External sites sending visitors">
          <RankBars items={(overview.topReferrers || []).map((r) => ({ key: r.hostname, label: r.hostname, value: r.count }))} color={SERIES[2]} />
        </Panel>
      </section>

      {insights && (
        <section className="grid gap-6 lg:grid-cols-2">
          <TimeOnPageList rows={insights.timeOnPage} labelFor={(row) => pageName(row.path)} />
          <Panel title="Browsers">
            <Donut data={foldTop(overview.browserBreakdown)} colorFor={rankColor} totalLabel="views" />
          </Panel>
        </section>
      )}

      {insights && (
        <>
          <DeviceEngagementTable rows={insights.deviceEngagement} />

          <section className="grid gap-6 lg:grid-cols-3">
            <Panel title="Operating systems">
              <Donut data={foldTop(insights.operatingSystems)} colorFor={rankColor} totalLabel="sessions" size={120} />
            </Panel>
            <Panel title="Screen sizes">
              <RankBars items={(insights.screens || []).map((s) => ({ key: s.label, label: s.label, value: s.count }))} />
            </Panel>
            <Panel title="Languages">
              <RankBars items={(insights.languages || []).map((l) => ({ key: l.label, label: languageName(l.label), value: l.count }))} color={SERIES[2]} />
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}

export default Analytics;
