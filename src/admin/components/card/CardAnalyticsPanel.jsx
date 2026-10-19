import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Nfc, QrCode, Link2, MousePointerClick, ChevronRight } from "lucide-react";

import { getCardAnalytics } from "../../services/card.service";
import TrendDelta from "../ui/TrendDelta";
import SkeletonCard from "../../../components/common/SkeletonCard";
import {
  countryFlag,
  formatLocation,
  formatDuration,
  timeAgo,
  DEVICE_ICONS,
} from "../visitors/visitorFormat";

const rangeOptions = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "1 Year", value: 365 },
];

/* Fixed source -> colour mapping (identity, never rank). */
const SOURCE_META = {
  nfc: { label: "NFC tap", color: "var(--color-chart-1)", icon: Nfc },
  qr: { label: "QR scan", color: "var(--color-chart-2)", icon: QrCode },
  link: { label: "Shared link", color: "var(--color-chart-3)", icon: Link2 },
  direct: { label: "Direct / typed", color: "var(--color-muted)", icon: MousePointerClick },
};
const SOURCE_ORDER = ["nfc", "qr", "link", "direct"];

const AXIS_TICK = { fontSize: 11, fill: "var(--color-muted)" };

const formatDay = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function Tile({ label, value, hint, children }) {
  return (
    <div className="card glass-hover space-y-2">
      <p className="text-small">{label}</p>
      <h2 className="text-heading tabular-nums">{value}</h2>
      {hint && <p className="text-muted text-xs">{hint}</p>}
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div className="rounded-xl border border-border bg-[var(--color-card)] px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-medium">
        {formatDay(label)} · {total} visit{total === 1 ? "" : "s"}
      </p>
      {payload
        .filter((p) => p.value)
        .map((p) => (
          <p key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto tabular-nums font-medium">{p.value}</span>
          </p>
        ))}
    </div>
  );
}

function BarRows({ items, emptyLabel, colorFor = () => "var(--color-chart-1)" }) {
  if (!items.length) return <p className="text-body">{emptyLabel}</p>;
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key || item.label} className="space-y-1.5">
          <div className="flex justify-between gap-3 text-small">
            <span className="truncate">{item.label}</span>
            <span className="text-muted tabular-nums shrink-0">
              {item.count}
              {item.suffix}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((item.count / max) * 100, 3)}%`, backgroundColor: colorFor(item) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardAnalyticsPanel() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getCardAnalytics(range)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && toast.error("Failed to load card analytics"));

    return () => {
      cancelled = true;
    };
  }, [range]);

  if (!data) return <SkeletonCard />;

  const { totals, conversion } = data;
  const activeSources = SOURCE_ORDER.filter((s) => data.daily.some((d) => d[s] > 0));

  return (
    <div className="space-y-6">
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

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Tile label="Card opens" value={totals.sessions} hint={`${totals.taps} page loads`}>
          <TrendDelta percent={totals.changePercent} />
        </Tile>
        <Tile
          label="People"
          value={totals.uniqueVisitors}
          hint={totals.repeatVisitors ? `${totals.repeatVisitors} came back` : "unique devices"}
        />
        <Tile label="Saved contact" value={`${conversion.savedPercent}%`} hint={`${conversion.saved} people`} />
        <Tile label="Called / messaged" value={`${conversion.contactedPercent}%`} hint={`${conversion.contacted} people`} />
        <Tile
          label="Opened portfolio"
          value={`${conversion.visitedPortfolioPercent}%`}
          hint={`${conversion.visitedPortfolio} people`}
        />
        <Tile label="Avg time on card" value={formatDuration(totals.avgTimeMs)} />
      </section>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-title">Card opens</h2>
            <p className="text-muted text-xs mt-1">Per day, by how the card was opened</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {(activeSources.length ? activeSources : ["nfc", "qr"]).map((s) => (
              <span key={s} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SOURCE_META[s].color }} />
                {SOURCE_META[s].label}
              </span>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} minTickGap={24} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
              {SOURCE_ORDER.map((s, index) => (
                <Bar
                  key={s}
                  dataKey={s}
                  name={SOURCE_META[s].label}
                  stackId="src"
                  fill={SOURCE_META[s].color}
                  stroke="var(--color-card)"
                  strokeWidth={1}
                  radius={index === SOURCE_ORDER.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="text-title mb-5">How it was opened</h2>
          <BarRows
            items={data.sources.map((s) => ({ key: s.source, label: s.label, count: s.count, suffix: ` · ${s.percent}%`, source: s.source }))}
            colorFor={(item) => SOURCE_META[item.source]?.color}
            emptyLabel="No card opens yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">What people tapped</h2>
          <BarRows
            items={data.actions.map((a) => ({ label: a.label, count: a.count }))}
            emptyLabel="No taps on buttons yet."
          />
        </div>

        <div className="card">
          <h2 className="text-title mb-5">Where</h2>
          <BarRows
            items={data.locations.map((l) => ({
              key: `${l.city}-${l.country}`,
              label: `${countryFlag(l.country)} ${formatLocation({ city: l.city, country: l.country })}`,
              count: l.count,
            }))}
            emptyLabel="No location data yet."
          />
          {data.devices.length > 0 && (
            <p className="text-muted text-xs mt-5">
              {data.devices.map((d) => `${d.percent}% ${d.device}`).join(" · ")}
            </p>
          )}
        </div>
      </section>

      <section className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-title">Recent card opens</h2>
          <p className="text-muted text-xs mt-1">Click one to see the full journey</p>
        </div>

        {!data.recent.length ? (
          <p className="text-body p-5">Nobody has opened the card in this range yet.</p>
        ) : (
          data.recent.map((r) => {
            const meta = SOURCE_META[r.source] || SOURCE_META.direct;
            const SourceIcon = meta.icon;
            const DeviceIcon = DEVICE_ICONS[r.device] || DEVICE_ICONS.desktop;

            return (
              <Link
                key={r.sessionId}
                to={`/dashboard/visitors/${r.sessionId}`}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-surface transition"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {countryFlag(r.location?.country)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium truncate">
                    {formatLocation(r.location)}
                    {r.tapCount > 1 && (
                      <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded bg-surface border border-border">
                        opened {r.tapCount}×
                      </span>
                    )}
                  </p>
                  <p className="text-muted text-xs truncate">
                    <SourceIcon size={12} className="inline -mt-0.5 mr-1" />
                    {meta.label} · <DeviceIcon size={12} className="inline -mt-0.5" /> {r.browser} · {r.os}
                    {r.ip && <span className="font-mono"> · {r.ip}</span>}
                  </p>
                  <p className="text-xs truncate mt-0.5">
                    {r.actions.length ? r.actions.join(" → ") : <span className="text-muted">Looked, no taps</span>}
                    {r.visitedPortfolio && !r.actions.includes("View full portfolio") && (
                      <span className="text-muted"> · opened portfolio</span>
                    )}
                  </p>
                </div>

                <div className="text-right text-xs shrink-0">
                  <p>{timeAgo(r.startedAt)}</p>
                  <p className="text-muted">{formatDuration(r.durationMs)}</p>
                </div>
                <ChevronRight size={16} className="text-muted shrink-0" />
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}

export default CardAnalyticsPanel;
