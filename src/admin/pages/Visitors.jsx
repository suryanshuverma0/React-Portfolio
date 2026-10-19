import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bot,
  Clock,
  Route as RouteIcon,
} from "lucide-react";

import {
  getVisitorSessions,
  getLiveVisitors,
  getJourneyInsights,
} from "../services/analytics.service";
import SkeletonCard from "../../components/common/SkeletonCard";
import {
  countryFlag,
  countryName,
  formatLocation,
  formatDuration,
  timeAgo,
  sectionLabel,
  pageLabel,
  describeReferrer,
  describeEvent,
  eventMeta,
  DEVICE_ICONS,
  SECTION_ORDER,
} from "../components/visitors/visitorFormat";

const rangeOptions = [
  { label: "24 Hours", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "All Time", value: 3650 },
];

const TABS = [
  { id: "sessions", label: "Sessions" },
  { id: "engagement", label: "Engagement" },
];

const PAGE_SIZE = 20;
const LIVE_REFRESH_MS = 15 * 1000;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ========================================
   SMALL BUILDING BLOCKS
========================================= */

function StatTile({ label, value, hint }) {
  return (
    <div className="card glass-hover space-y-2">
      <p className="text-small">{label}</p>
      <h2 className="text-heading tabular-nums">{value}</h2>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

// Magnitude bars — one sequential hue, width relative to the list max.
function BarList({ items, emptyLabel, formatValue = (v) => v }) {
  if (!items?.length) {
    return <p className="text-body">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key || item.label} className="space-y-1.5" title={item.title}>
          <div className="flex items-center justify-between gap-3 text-small">
            <span className="truncate">{item.label}</span>
            <span className="text-muted shrink-0 tabular-nums">
              {formatValue(item.value, item)}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%`,
                backgroundColor: "var(--color-chart-1)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================================
   LIVE VISITORS
========================================= */

function LiveVisitors({ live, onRefresh, refreshing }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-title inline-flex items-center gap-3">
          <LiveDot />
          Live now
          <span className="text-muted text-small tabular-nums">({live.length})</span>
        </h2>

        <button
          type="button"
          onClick={onRefresh}
          className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface"
          aria-label="Refresh live visitors"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {live.length === 0 ? (
        <p className="text-body">Nobody is on the portfolio right now.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {live.map((session) => {
            const DeviceIcon = DEVICE_ICONS[session.device] || DEVICE_ICONS.desktop;
            const last = session.lastEvent;

            return (
              <Link
                key={session.sessionId}
                to={`/dashboard/visitors/${session.sessionId}`}
                className="rounded-control border border-border bg-surface p-4 flex gap-3 hover:border-primary transition"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {countryFlag(session.location?.country)}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-small font-medium truncate">
                    {formatLocation(session.location)}
                  </p>

                  <p className="text-muted text-xs inline-flex items-center gap-1.5">
                    <DeviceIcon size={13} />
                    {session.browser} · {session.os} · on for {formatDuration(session.durationMs)}
                  </p>

                  <p className="text-xs truncate">
                    <span className="text-muted">Now on </span>
                    {pageLabel(session.exitPage)}
                    {last && (
                      <span className="text-muted">
                        {" "}· {eventMeta(last.type).name.toLowerCase()} {describeEvent(last)}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ========================================
   SESSIONS LIST
========================================= */

function SessionRow({ session, onOpen }) {
  const DeviceIcon = DEVICE_ICONS[session.device] || DEVICE_ICONS.desktop;
  const sameEntryExit = session.entryPage === session.exitPage;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left grid gap-3 md:gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] items-center px-4 py-4 border-b border-border last:border-b-0 hover:bg-surface transition"
    >
      {/* who / where */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl leading-none shrink-0" aria-hidden>
          {countryFlag(session.location?.country)}
        </span>

        <div className="min-w-0">
          <p className="text-small font-medium truncate inline-flex items-center gap-2 max-w-full">
            {session.isLive && <LiveDot />}
            <span className="truncate">{formatLocation(session.location)}</span>
          </p>

          <p className="text-muted text-xs truncate font-mono">
            {session.ip || "IP unknown"}
            {session.visitCount > 1 && (
              <span className="font-sans ml-2 px-1.5 py-0.5 rounded bg-surface border border-border">
                visit #{session.visitCount}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* device */}
      <div className="min-w-0 text-xs">
        <p className="inline-flex items-center gap-1.5 text-small capitalize">
          <DeviceIcon size={14} />
          {session.device}
          {session.isBot && <Bot size={14} className="text-muted" aria-label="Bot" />}
        </p>
        <p className="text-muted truncate">
          {session.browser} · {session.os}
          {session.screen ? ` · ${session.screen}` : ""}
        </p>
      </div>

      {/* journey */}
      <div className="min-w-0 text-xs">
        <p className="text-small truncate">
          {pageLabel(session.entryPage)}
          {!sameEntryExit && <span className="text-muted"> → {pageLabel(session.exitPage)}</span>}
        </p>
        <p className="text-muted truncate">
          {session.pageViews} page{session.pageViews === 1 ? "" : "s"} · {session.eventCount} events ·
          scrolled {session.maxScrollDepth || 0}% · from {describeReferrer(session)}
        </p>
      </div>

      {/* time */}
      <div className="text-xs">
        <p className="text-small inline-flex items-center gap-1.5 tabular-nums">
          <Clock size={13} className="text-muted" />
          {formatDuration(session.durationMs)}
        </p>
        <p className="text-muted">engaged {formatDuration(session.activeTimeMs)}</p>
      </div>

      <p className="text-muted text-xs md:text-right whitespace-nowrap" title={new Date(session.startedAt).toLocaleString()}>
        {timeAgo(session.startedAt)}
      </p>
    </button>
  );
}

function SessionsPanel({ range }) {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [device, setDevice] = useState("");
  const [includeBots, setIncludeBots] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const result = await getVisitorSessions({
          page,
          limit: PAGE_SIZE,
          range,
          search: search || undefined,
          device: device || undefined,
          bots: includeBots ? "true" : undefined,
        });

        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) toast.error("Failed to load sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, range, search, device, includeBots]);

  const pagination = data?.pagination;

  return (
    <section className="card p-0 overflow-hidden">
      <div className="p-5 flex flex-wrap items-center gap-3 border-b border-border">
        <h2 className="text-title mr-auto">
          Sessions{" "}
          {pagination && (
            <span className="text-muted text-small tabular-nums">({pagination.total})</span>
          )}
        </h2>

        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="IP, city, source, visitor id…"
            className="h-control pl-9 pr-3 rounded-control border border-border bg-surface text-small w-64 max-w-full"
          />
        </label>

        <select
          value={device}
          onChange={(e) => {
            setDevice(e.target.value);
            setPage(1);
          }}
          className="h-control px-3 rounded-control border border-border bg-surface text-small"
          aria-label="Filter by device"
        >
          <option value="">All devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
        </select>

        <label className="inline-flex items-center gap-2 text-small cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeBots}
            onChange={(e) => {
              setIncludeBots(e.target.checked);
              setPage(1);
            }}
          />
          Include bots
        </label>
      </div>

      {loading && !data ? (
        <div className="p-5">
          <SkeletonCard />
        </div>
      ) : !data?.sessions.length ? (
        <p className="text-body p-5">
          {search || device ? "No sessions match these filters." : "No visitor sessions recorded in this range yet."}
        </p>
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] gap-4 px-4 py-2 text-xs text-muted uppercase tracking-wide border-b border-border">
            <span>Visitor</span>
            <span>Device</span>
            <span>Journey</span>
            <span>Time on site</span>
            <span className="text-right">Started</span>
          </div>

          {data.sessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              session={session}
              onOpen={() => navigate(`/dashboard/visitors/${session.sessionId}`)}
            />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3 p-4 border-t border-border text-small">
          <span className="text-muted tabular-nums">
            Page {pagination.page} of {pagination.pages}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================
   ENGAGEMENT
========================================= */

// Weekday × hour heatmap, sequential single hue. Each cell carries a native
// tooltip with its exact count; the legend shows the scale.
function VisitHeatmap({ cells, timezone }) {
  const grid = useMemo(() => {
    const map = new Map(cells.map((c) => [`${c.day}-${c.hour}`, c.count]));
    return DAY_NAMES.map((_, day) =>
      Array.from({ length: 24 }, (_, hour) => map.get(`${day}-${hour}`) || 0),
    );
  }, [cells]);

  const max = Math.max(1, ...cells.map((c) => c.count));

  const fill = (count) =>
    count === 0
      ? "var(--color-surface)"
      : `color-mix(in srgb, var(--color-chart-1) ${Math.round(20 + (count / max) * 80)}%, transparent)`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[560px] space-y-1">
          {grid.map((hours, day) => (
            <div key={DAY_NAMES[day]} className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px] items-center">
              <span className="text-xs text-muted">{DAY_NAMES[day]}</span>
              {hours.map((count, hour) => (
                <div
                  key={hour}
                  className="h-5 rounded-[3px]"
                  style={{ backgroundColor: fill(count) }}
                  title={`${DAY_NAMES[day]} ${String(hour).padStart(2, "0")}:00 — ${count} session${count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          ))}

          <div className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-muted">
            <span />
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className="text-center">
                {hour % 3 === 0 ? hour : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>Times in {timezone}</span>
        <span className="inline-flex items-center gap-2">
          Fewer
          {[0.2, 0.45, 0.7, 1].map((step) => (
            <span
              key={step}
              className="h-3 w-3 rounded-[3px]"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-chart-1) ${Math.round(step * 100)}%, transparent)`,
              }}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function EngagementPanel({ insights }) {
  if (!insights) return <SkeletonCard />;

  const sectionMap = new Map(insights.sections.map((s) => [s.section, s]));
  const orderedSections = [
    ...SECTION_ORDER.filter((id) => sectionMap.has(id)).map((id) => sectionMap.get(id)),
    ...insights.sections.filter((s) => !SECTION_ORDER.includes(s.section)),
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-title mb-1">Section reach</h2>
          <p className="text-muted text-xs mb-5">
            Share of sessions that saw each section (≥1s, half on screen) · avg time spent
          </p>

          <BarList
            items={orderedSections.map((s) => ({
              key: s.section,
              label: sectionLabel(s.section),
              value: s.reachPercent,
              dwell: s.avgDwellMs,
              title: `${s.sessions} sessions · ${s.views} views · total ${formatDuration(s.totalDwellMs)}`,
            }))}
            formatValue={(value, item) => `${value}% · ${formatDuration(item.dwell)}`}
            emptyLabel="No section views recorded yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-1">How long visitors stay</h2>
          <p className="text-muted text-xs mb-5">Sessions by total time on site</p>

          <BarList
            items={insights.durationDistribution.map((b) => ({
              key: b.label,
              label: b.label,
              value: b.count,
            }))}
            emptyLabel="No sessions yet."
          />
        </div>
      </section>

      <section className="card">
        <h2 className="text-title mb-5">When people visit</h2>
        <VisitHeatmap cells={insights.heatmap} timezone={insights.timezone} />
      </section>

      <section className="card">
        <h2 className="text-title mb-5">Top interactions</h2>

        {!insights.topInteractions.length ? (
          <p className="text-body">No clicks recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {insights.topInteractions.map((row) => {
              const meta = eventMeta(row.type);
              const Icon = meta.icon;

              return (
                <div
                  key={`${row.type}-${row.label}-${row.target}`}
                  className="flex items-center gap-3 py-3 text-small"
                >
                  <Icon size={16} className="text-muted shrink-0" aria-label={meta.name} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate">{row.label}</p>
                    {row.target && row.target !== row.label && (
                      <p className="text-muted text-xs truncate">{row.target}</p>
                    )}
                  </div>

                  <span className="text-muted text-xs hidden sm:inline whitespace-nowrap">
                    {meta.name}
                  </span>
                  <span className="tabular-nums shrink-0 w-16 text-right" title={`${row.sessions} sessions`}>
                    {row.count}×
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="text-title mb-5">Top cities</h2>
          <BarList
            items={insights.topCities.map((c) => ({
              key: `${c.city}-${c.country}`,
              label: `${countryFlag(c.country)} ${c.city}, ${countryName(c.country)}`,
              value: c.count,
            }))}
            emptyLabel="No location data yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Entry pages</h2>
          <BarList
            items={insights.entryPages.map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.count }))}
            emptyLabel="No sessions yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Exit pages</h2>
          <BarList
            items={insights.exitPages.map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.count }))}
            emptyLabel="No sessions yet."
          />
        </div>
      </section>

      <section className="card">
        <h2 className="text-title mb-1">Campaigns</h2>
        <p className="text-muted text-xs mb-5">
          Add <code>?utm_source=linkedin&amp;utm_campaign=job-hunt</code> to links you share to see them here.
        </p>
        <BarList
          items={insights.campaigns.map((c) => ({
            key: `${c.source}-${c.medium}-${c.campaign}`,
            label: [c.source, c.medium, c.campaign].filter(Boolean).join(" / "),
            value: c.count,
          }))}
          emptyLabel="No UTM-tagged visits yet."
        />
      </section>
    </div>
  );
}

/* ========================================
   PAGE
========================================= */

function Visitors() {
  const [range, setRange] = useState(30);
  const [tab, setTab] = useState("sessions");
  const [insights, setInsights] = useState(null);
  const [live, setLive] = useState([]);
  const [refreshingLive, setRefreshingLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getJourneyInsights(range)
      .then((data) => !cancelled && setInsights(data))
      .catch(() => !cancelled && toast.error("Failed to load visitor insights"));

    return () => {
      cancelled = true;
    };
  }, [range]);

  const loadLive = useCallback(async () => {
    try {
      const data = await getLiveVisitors();
      setLive(data);
    } catch {
      /* the live panel just keeps its last state */
    }
  }, []);

  const refreshLive = async () => {
    setRefreshingLive(true);
    await loadLive();
    setRefreshingLive(false);
  };

  useEffect(() => {
    const poll = () => {
      loadLive();
    };

    const first = setTimeout(poll, 0);
    const timer = setInterval(poll, LIVE_REFRESH_MS);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [loadLive]);

  const totals = insights?.totals;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <RouteIcon size={28} />
            Visitors
          </h1>
          <p className="text-body mt-3">
            Every session on your portfolio — where visitors came from, what they saw, and how long they stayed.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`h-control px-4 rounded-control border border-border text-small transition ${
                range === option.value ? "bg-primary text-background" : "bg-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Sessions"
          value={totals?.sessions ?? "—"}
          hint={totals ? `${totals.visitors} unique visitors` : undefined}
        />
        <StatTile
          label="Avg time on site"
          value={totals ? formatDuration(totals.avgDurationMs) : "—"}
          hint={totals ? `${formatDuration(totals.avgActiveTimeMs)} actively viewing` : undefined}
        />
        <StatTile
          label="Pages / session"
          value={totals?.avgPageViews ?? "—"}
        />
        <StatTile
          label="Avg scroll depth"
          value={totals ? `${totals.avgScrollDepth}%` : "—"}
        />
        <StatTile
          label="Bounce rate"
          value={totals ? `${totals.bounceRate}%` : "—"}
          hint="1 page, under 10s"
        />
      </section>

      <LiveVisitors live={live} onRefresh={refreshLive} refreshing={refreshingLive} />

      <div className="flex gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-small -mb-px border-b-2 transition ${
              tab === t.id ? "border-primary font-medium" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* keyed by range so changing it starts again from page 1 */}
      {tab === "sessions" ? <SessionsPanel key={range} range={range} /> : <EngagementPanel insights={insights} />}
    </div>
  );
}

export default Visitors;
