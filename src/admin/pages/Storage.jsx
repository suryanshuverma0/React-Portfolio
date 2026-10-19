import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from "lucide-react";

import { getStorageOverview } from "../services/storage.service";
import SkeletonCard from "../../components/common/SkeletonCard";

/* ========================================
   Fixed category -> color mapping (identity,
   never rank). "Other" is always muted.
========================================= */

const CATEGORY_COLORS = {
  Analytics: "var(--color-chart-1)",
  Content: "var(--color-chart-2)",
  Blog: "var(--color-chart-3)",
  Accounts: "var(--color-chart-4)",
  Other: "var(--color-muted)",
};

const CATEGORY_HINTS = {
  Analytics: "Visitor sessions, journey events and page views",
  Content: "Profile, projects, skills, experience, messages…",
  Blog: "Posts and comments",
  Accounts: "Users and passkeys",
  Other: "Settings and collections without a model",
};

const SORTS = {
  totalSize: "Total size",
  dataSize: "Data",
  indexSize: "Indexes",
  documents: "Documents",
  created30d: "New (30d)",
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value >= 100 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
};

const formatNumber = (n) => (n ?? 0).toLocaleString();

// Status is reserved for quota health and always shown with icon + label.
const quotaStatus = (percent) => {
  if (percent >= 90) {
    return { label: "Critical", icon: AlertOctagon, className: "text-red-600 dark:text-red-400", bar: "#dc2626" };
  }
  if (percent >= 70) {
    return { label: "Getting full", icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400", bar: "#d97706" };
  }
  return { label: "Healthy", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400", bar: "#059669" };
};

/* ========================================
   PIECES
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

function QuotaMeter({ quota }) {
  const status = quotaStatus(quota.percent);
  const StatusIcon = status.icon;

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-small">Database quota</p>
          <p className="text-heading tabular-nums mt-1">
            {formatBytes(quota.usedBytes)}
            <span className="text-muted text-title"> / {formatBytes(quota.limitBytes)}</span>
          </p>
        </div>

        <p className={`inline-flex items-center gap-2 text-small font-medium ${status.className}`}>
          <StatusIcon size={16} />
          {status.label} · {quota.percent}% used
        </p>
      </div>

      <div
        className="h-3 rounded-full bg-surface overflow-hidden"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={quota.percent}
        aria-label="Database quota used"
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(Math.min(quota.percent, 100), 0.5)}%`, backgroundColor: status.bar }}
        />
      </div>

      <p className="text-muted text-xs">
        {formatBytes(quota.remainingBytes)} free. Counted the way Atlas counts shared-tier storage
        (data + indexes). Set <code>MONGO_STORAGE_LIMIT_MB</code> on the backend if you upgrade from
        the 512 MB free tier.
      </p>
    </section>
  );
}

// Part-to-whole: one stacked bar (2px surface gaps between segments) plus a
// legend that carries the labels and values, so identity is never color-only.
function CategoryBreakdown({ categories, usedBytes }) {
  const visible = categories.filter((c) => c.bytes > 0);

  return (
    <section className="card">
      <h2 className="text-title mb-1">What takes up space</h2>
      <p className="text-muted text-xs mb-5">Share of used storage (data + indexes) by area</p>

      {!visible.length ? (
        <p className="text-body">The database is empty.</p>
      ) : (
        <>
          <div className="flex h-4 rounded-full overflow-hidden gap-[2px] bg-[var(--color-card)]">
            {visible.map((c) => (
              <div
                key={c.category}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${Math.max((c.bytes / usedBytes) * 100, 0.75)}%`,
                  backgroundColor: CATEGORY_COLORS[c.category],
                }}
                title={`${c.category}: ${formatBytes(c.bytes)} (${c.percent}%)`}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {categories.map((c) => (
              <div key={c.category} className="flex gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                />
                <div className="min-w-0">
                  <p className="text-small font-medium">
                    {c.category}{" "}
                    <span className="text-muted font-normal tabular-nums">
                      {formatBytes(c.bytes)} · {c.percent}%
                    </span>
                  </p>
                  <p className="text-muted text-xs">
                    {formatNumber(c.documents)} docs in {c.collections} collection
                    {c.collections === 1 ? "" : "s"} · {CATEGORY_HINTS[c.category]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function GrowthCard({ growth, quota, generatedAt }) {
  const days = growth.daysUntilFull;

  let projection;
  if (days === null) projection = "No new data in the last 30 days.";
  else if (days > 3650) projection = "At this rate the quota won't fill up for 10+ years.";
  else {
    const date = new Date(new Date(generatedAt).getTime() + days * 86400000).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
    projection = `At this rate the quota fills up in about ${formatNumber(days)} days (${date}).`;
  }

  return (
    <section className="card">
      <h2 className="text-title mb-1">Growth</h2>
      <p className="text-muted text-xs mb-5">
        Estimated from documents created recently × their average size
      </p>

      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-small">Last 7 days</dt>
          <dd className="text-title tabular-nums mt-1">+{formatBytes(growth.last7dBytes)}</dd>
        </div>
        <div>
          <dt className="text-small">Last 30 days</dt>
          <dd className="text-title tabular-nums mt-1">+{formatBytes(growth.last30dBytes)}</dd>
        </div>
        <div>
          <dt className="text-small">Per day</dt>
          <dd className="text-title tabular-nums mt-1">+{formatBytes(growth.perDayBytes)}</dd>
        </div>
      </dl>

      <p className={`text-small mt-5 ${quota.percent >= 70 ? quotaStatus(quota.percent).className : ""}`}>
        {projection}
      </p>
    </section>
  );
}

function CollectionDetail({ collection }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 px-4 pb-5 pt-1 text-small">
      <dl className="space-y-2">
        {[
          ["Collection", <code key="c">{collection.name}</code>],
          ["Model", collection.model || "—"],
          ["Documents", formatNumber(collection.documents)],
          ["Avg document", formatBytes(collection.avgDocSize)],
          ["Data (uncompressed)", formatBytes(collection.dataSize)],
          ["On disk (compressed)", formatBytes(collection.storageSize)],
          ["Compression", collection.compressionRatio ? `${collection.compressionRatio}×` : "—"],
          ["Created last 7 / 30 days", `${formatNumber(collection.created7d)} / ${formatNumber(collection.created30d)}`],
          ["Est. growth (30 days)", `+${formatBytes(collection.estimatedGrowth30dBytes)}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="text-muted mb-2">
          Indexes ({collection.indexes.length}) · {formatBytes(collection.indexSize)}
        </p>

        {!collection.indexes.length ? (
          <p className="text-muted text-xs">No index details available.</p>
        ) : (
          <ul className="space-y-1.5">
            {collection.indexes.map((index) => (
              <li key={index.name} className="flex justify-between gap-4">
                <code className="text-xs truncate">{index.name}</code>
                <span className="text-muted text-xs tabular-nums shrink-0">{formatBytes(index.size)}</span>
              </li>
            ))}
          </ul>
        )}

        {collection.statsSource !== "collStats" && (
          <p className="text-muted text-xs mt-3 inline-flex items-center gap-1.5">
            <Info size={13} /> Size stats aren&apos;t available for this collection on your cluster tier.
          </p>
        )}
      </div>
    </div>
  );
}

function CollectionsTable({ collections, usedBytes }) {
  const [sortKey, setSortKey] = useState("totalSize");
  const [expanded, setExpanded] = useState(() => new Set());

  const sorted = useMemo(
    () => [...collections].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)),
    [collections, sortKey],
  );

  const toggle = (name) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const maxSize = Math.max(1, ...collections.map((c) => c.totalSize));

  return (
    <section className="card p-0 overflow-hidden">
      <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <h2 className="text-title">
          Collections <span className="text-muted text-small tabular-nums">({collections.length})</span>
        </h2>

        <label className="inline-flex items-center gap-2 text-small">
          <ArrowUpDown size={15} className="text-muted" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="h-control px-3 rounded-control border border-border bg-surface text-small"
            aria-label="Sort collections by"
          >
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                Sort by {label.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hidden md:grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_minmax(0,1.4fr)] gap-4 px-4 py-2 text-xs text-muted uppercase tracking-wide border-b border-border">
        <span>Collection</span>
        <span className="text-right">Documents</span>
        <span className="text-right">Data</span>
        <span className="text-right">Indexes</span>
        <span className="text-right">New (30d)</span>
        <span>Share of used</span>
      </div>

      {sorted.map((c) => {
        const isOpen = expanded.has(c.name);
        const share = usedBytes > 0 ? (c.totalSize / usedBytes) * 100 : 0;

        return (
          <Fragment key={c.name}>
            <button
              type="button"
              onClick={() => toggle(c.name)}
              aria-expanded={isOpen}
              className="w-full text-left grid grid-cols-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_minmax(0,1.4fr)] gap-x-4 gap-y-2 items-center px-4 py-3.5 border-b border-border hover:bg-surface transition"
            >
              <span className="col-span-2 md:col-span-1 flex items-center gap-2.5 min-w-0">
                {isOpen ? (
                  <ChevronDown size={16} className="text-muted shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-muted shrink-0" />
                )}
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Other }}
                  title={c.category}
                />
                <span className="min-w-0">
                  <span className="block text-small font-medium truncate">{c.label}</span>
                  <span className="block text-muted text-xs truncate">
                    {c.name} · {c.category}
                  </span>
                </span>
              </span>

              <span className="text-small tabular-nums md:text-right">
                <span className="md:hidden text-muted">Docs </span>
                {formatNumber(c.documents)}
              </span>
              <span className="text-small tabular-nums md:text-right">
                <span className="md:hidden text-muted">Data </span>
                {formatBytes(c.dataSize)}
              </span>
              <span className="text-small tabular-nums md:text-right">
                <span className="md:hidden text-muted">Indexes </span>
                {formatBytes(c.indexSize)}
              </span>
              <span className="text-small tabular-nums md:text-right">
                <span className="md:hidden text-muted">New 30d </span>
                {c.created30d ? `+${formatNumber(c.created30d)}` : "—"}
              </span>

              <span className="col-span-2 md:col-span-1 flex items-center gap-3">
                <span className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max((c.totalSize / maxSize) * 100, c.totalSize ? 2 : 0)}%`,
                      backgroundColor: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Other,
                    }}
                  />
                </span>
                <span className="text-xs text-muted tabular-nums w-12 text-right">
                  {share < 0.1 && share > 0 ? "<0.1" : share.toFixed(1)}%
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="border-b border-border bg-surface/40">
                <CollectionDetail collection={c} />
              </div>
            )}
          </Fragment>
        );
      })}
    </section>
  );
}

/* ========================================
   PAGE
========================================= */

function Storage() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh) => {
    try {
      const result = await getStorageOverview({ refresh });
      setData(result);
    } catch {
      toast.error("Failed to load storage stats");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(false), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  if (!data) return <SkeletonCard />;

  const { totals, quota, growth, categories, collections } = data;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <Database size={28} />
            Storage
          </h1>
          <p className="text-body mt-3">
            MongoDB usage for <code>{data.database}</code> — what&apos;s stored and how much room is left.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <QuotaMeter quota={quota} />

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatTile label="Data size" value={formatBytes(totals.dataSize)} hint="uncompressed documents" />
        <StatTile label="Index size" value={formatBytes(totals.indexSize)} hint={`${formatNumber(totals.indexes)} indexes`} />
        <StatTile label="On disk" value={formatBytes(totals.storageSize)} hint="compressed data files" />
        <StatTile label="Documents" value={formatNumber(totals.documents)} hint={`avg ${formatBytes(totals.avgDocSize)} each`} />
        <StatTile label="Collections" value={formatNumber(totals.collections)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CategoryBreakdown categories={categories} usedBytes={quota.usedBytes} />
        <GrowthCard growth={growth} quota={quota} generatedAt={data.generatedAt} />
      </section>

      {data.partialStats && (
        <p className="text-muted text-xs inline-flex items-center gap-1.5">
          <Info size={14} /> Some collections only report document counts on this cluster tier, so their sizes show as 0.
        </p>
      )}

      <CollectionsTable collections={collections} usedBytes={quota.usedBytes} />
    </div>
  );
}

export default Storage;
