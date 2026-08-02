import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getAnalyticsOverview } from "../services/analytics.service";
import SkeletonCard from "../../components/common/SkeletonCard";
import TrendDelta from "../components/ui/TrendDelta";

const rangeOptions = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

/* ========================================
   Fixed per-dimension categorical colors.
   Each dimension owns its own slot order —
   an entity always gets the same color,
   regardless of its rank in the current
   range/filter.
========================================= */

const DEVICE_COLORS = {
  desktop: "var(--color-chart-1)",
  mobile: "var(--color-chart-2)",
  tablet: "var(--color-chart-3)",
};

const SOURCE_COLORS = {
  Direct: "var(--color-chart-1)",
  Search: "var(--color-chart-2)",
  Social: "var(--color-chart-3)",
  Referral: "var(--color-chart-4)",
};

const NEW_RETURNING_COLORS = {
  New: "var(--color-chart-1)",
  Returning: "var(--color-chart-2)",
};

// Browser names aren't a fixed known set, so top-4-by-rank + "Other" is the
// pragmatic fallback (rank-assigned only within this single render, not
// re-painted as counts shift between range changes... acceptable since
// this is a top-N-plus-other pattern, not a live-filtered chart).
const RANK_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];
const OTHER_COLOR = "var(--color-muted)";

const REGION_NAMES =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

const countryName = (code) => {
  if (!code) return "Unknown";

  try {
    return REGION_NAMES?.of(code) || code;
  } catch {
    return code;
  }
};

/* ========================================
   RANKED LIST
   Magnitude comparison — sequential (one
   hue), bar width relative to the max
   value in the visible list.
========================================= */

function RankedList({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-body">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-small">
            <span className="truncate">{item.label}</span>

            <span className="text-muted shrink-0 tabular-nums">
              {item.count}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.count / max) * 100, 3)}%`,
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
   CATEGORY BREAKDOWN
   Part-to-whole — categorical, percent of
   total, color by fixed entity mapping (or
   rank-assigned when the set is open-ended).
========================================= */

function CategoryBreakdown({ items, colorFor, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-body">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-small">
            <span className="inline-flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colorFor(item, index) }}
              />
              <span className="truncate capitalize">{item.label}</span>
            </span>

            <span className="text-muted shrink-0 tabular-nums">
              {item.percent}%
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(item.percent, 3)}%`,
                backgroundColor: colorFor(item, index),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const [range, setRange] = useState(30);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);

        const data = await getAnalyticsOverview(range);

        setOverview(data);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [range]);

  if (loading && !overview) {
    return <SkeletonCard />;
  }

  const avgPerDay = overview
    ? Math.round((overview.totalViews / range) * 10) / 10
    : 0;

  const newVsReturningItems = overview?.newVsReturning
    ? [
        { label: "New", count: overview.newVsReturning.new },
        { label: "Returning", count: overview.newVsReturning.returning },
      ]
    : [];

  const newVsReturningTotal =
    newVsReturningItems.reduce((sum, item) => sum + item.count, 0) || 0;

  const newVsReturningWithPercent = newVsReturningItems.map((item) => ({
    ...item,
    percent:
      newVsReturningTotal > 0
        ? Math.round((item.count / newVsReturningTotal) * 1000) / 10
        : 0,
  }));

  const topReferrerItems =
    overview?.topReferrers?.map((row) => ({
      label: row.hostname,
      count: row.count,
    })) || [];

  const topCountryItems =
    overview?.topCountries?.map((row) => ({
      label: countryName(row.country),
      count: row.count,
    })) || [];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading">Analytics</h1>

          <p className="text-body mt-3">
            Real traffic on your public portfolio.
          </p>
        </div>

        <div className="flex gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`h-control px-4 rounded-control border border-border text-small transition ${
                range === option.value
                  ? "bg-primary text-background"
                  : "bg-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card glass-hover space-y-2">
          <p className="text-small">Total Views</p>
          <h2 className="text-heading">{overview?.totalViews ?? 0}</h2>
          <TrendDelta percent={overview?.trend?.viewsChangePercent} />
        </div>

        <div className="card glass-hover space-y-2">
          <p className="text-small">Unique Visitors</p>
          <h2 className="text-heading">{overview?.uniqueVisitors ?? 0}</h2>
          <TrendDelta percent={overview?.trend?.visitorsChangePercent} />
        </div>

        <div className="card glass-hover space-y-2">
          <p className="text-small">Avg Views / Day</p>
          <h2 className="text-heading">{avgPerDay}</h2>
        </div>

        <div className="card glass-hover space-y-2">
          <p className="text-small">Active Now</p>
          <h2 className="text-heading inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            {overview?.activeNow ?? 0}
          </h2>
          <p className="text-muted text-xs">last 5 minutes</p>
        </div>
      </section>

      <section className="card">
        <h2 className="text-title mb-6">Views Over Time</h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview?.viewsByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.slice(5)}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary, #3b82f6)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-title mb-5">Top Pages</h2>

          <RankedList
            items={overview?.topPages?.map((p) => ({
              label: p.path,
              count: p.count,
            }))}
            emptyLabel="No page views recorded yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Top Referrers</h2>

          <RankedList
            items={topReferrerItems}
            emptyLabel="No external referrers yet — traffic is direct."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-title mb-5">Traffic Sources</h2>

          <CategoryBreakdown
            items={overview?.referrerSources}
            colorFor={(item) => SOURCE_COLORS[item.label] || OTHER_COLOR}
            emptyLabel="No traffic recorded yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">New vs Returning</h2>

          <CategoryBreakdown
            items={newVsReturningWithPercent}
            colorFor={(item) => NEW_RETURNING_COLORS[item.label] || OTHER_COLOR}
            emptyLabel="No visitors recorded yet."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="text-title mb-5">Devices</h2>

          <CategoryBreakdown
            items={overview?.deviceBreakdown}
            colorFor={(item) => DEVICE_COLORS[item.label] || OTHER_COLOR}
            emptyLabel="No device data yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Browsers</h2>

          <CategoryBreakdown
            items={overview?.browserBreakdown}
            colorFor={(item, index) =>
              item.label === "Other"
                ? OTHER_COLOR
                : RANK_COLORS[index] || OTHER_COLOR
            }
            emptyLabel="No browser data yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Top Countries</h2>

          <RankedList items={topCountryItems} emptyLabel="No location data yet." />
        </div>
      </section>
    </div>
  );
}

export default Analytics;
