import { useState } from "react";
import { toast } from "react-toastify";
import { MapPinned, RefreshCw } from "lucide-react";

import SkeletonCard from "../../../components/common/SkeletonCard";
import { Panel, Donut, RankBars, Empty } from "../charts/ChartKit";
import { SERIES, MUTED } from "../charts/chartTokens";
import { getGeoDebug } from "../../services/analytics.service";
import { countryFlag, countryName, formatDuration, formatLocation } from "./visitorFormat";

/* ========================================
   AUDIENCE — where visitors are, what they
   browse with, and how engaged each device
   and browser group is.
========================================= */

const UNKNOWN = "Unknown";

const LANGUAGE_NAMES =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

const languageName = (code) => {
  if (!code) return UNKNOWN;

  try {
    return LANGUAGE_NAMES?.of(code) || code;
  } catch {
    return code;
  }
};

// Devices keep a fixed hue each, so colours don't swap between ranges.
const DEVICE_COLORS = { desktop: SERIES[0], mobile: SERIES[1], tablet: SERIES[2] };

const percent = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);

// Top `size - 1` rows plus everything else folded into "Other", so a share
// chart never needs more than four hues.
const foldOther = (rows, size = 4) => {
  const labelled = rows.map((row) => ({ ...row, label: row.label || UNKNOWN }));
  if (labelled.length <= size) return labelled;

  const head = labelled.slice(0, size - 1);
  const rest = labelled.slice(size - 1).reduce((sum, row) => sum + row.count, 0);

  return [...head, { label: "Other", count: rest }];
};

const shareColor = (row, index) => (row.label === "Other" || row.label === UNKNOWN ? MUTED : SERIES[index]);

function KpiTile({ label, value, hint }) {
  return (
    <div className="card space-y-2">
      <p className="text-small">{label}</p>
      <p className="text-heading tabular-nums">{value}</p>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
}

// 100% segmented bar with a legend underneath — reads like a donut but
// keeps long names (browser / OS versions) legible.
function ShareBar({ rows }) {
  const data = foldOther(rows);
  const total = data.reduce((sum, row) => sum + row.count, 0);

  if (!total) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {data.map((row, index) => (
          <div
            key={row.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(row.count / total) * 100}%`, backgroundColor: shareColor(row, index) }}
            title={`${row.label} — ${row.count} sessions (${percent(row.count, total)}%)`}
          />
        ))}
      </div>

      <ul className="space-y-2">
        {data.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2 text-small">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: shareColor(row, index) }} />
            <span className="flex-1 truncate">{row.label}</span>
            <span className="text-muted tabular-nums">{row.count}</span>
            <span className="w-12 text-right tabular-nums">{percent(row.count, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const rankItems = (rows, labelFor, total) =>
  rows.map((row) => ({
    key: row.label ?? UNKNOWN,
    label: labelFor(row.label),
    value: row.count,
    title: `${row.count} sessions · ${percent(row.count, total)}%`,
  }));

const withShare = (total) => (value) => `${value} · ${percent(value, total)}%`;

function EngagementTable({ title, subtitle, rows, labelFor = (v) => v || UNKNOWN }) {
  const maxActive = Math.max(1, ...rows.map((row) => row.avgActiveTimeMs));

  return (
    <Panel title={title} subtitle={subtitle}>
      {!rows.length ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-small">
            <thead>
              <tr className="text-xs text-muted uppercase tracking-wide border-b border-border">
                <th className="py-2 pr-3 text-left font-normal">Group</th>
                <th className="py-2 px-3 text-right font-normal">Sessions</th>
                <th className="py-2 px-3 text-left font-normal w-[30%]">Avg engaged time</th>
                <th className="py-2 px-3 text-right font-normal">Pages</th>
                <th className="py-2 px-3 text-right font-normal">Scroll</th>
                <th className="py-2 pl-3 text-right font-normal">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label ?? UNKNOWN} className="border-b border-border last:border-b-0">
                  <td className="py-3 pr-3 capitalize">{labelFor(row.label)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{row.sessions}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2" title={`${formatDuration(row.avgDurationMs)} on site on average`}>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max((row.avgActiveTimeMs / maxActive) * 100, row.avgActiveTimeMs ? 3 : 0)}%`,
                            backgroundColor: "var(--color-chart-1)",
                          }}
                        />
                      </div>
                      <span className="w-14 text-right tabular-nums">{formatDuration(row.avgActiveTimeMs)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{row.avgPageViews}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{row.avgScrollDepth}%</td>
                  <td className="py-3 pl-3 text-right tabular-nums">{row.bounceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// Asks the API what it resolves for this browser — confirms the proxy
// chain is passing the real IP through.
function GeoCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    try {
      setLoading(true);
      setResult(await getGeoDebug());
    } catch {
      toast.error("Location check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="Location detection check"
      subtitle="Shows the IP and location the server resolves for you right now."
      right={
        <button
          type="button"
          onClick={run}
          className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <MapPinned size={15} />}
          Test my location
        </button>
      }
    >
      {result ? (
        <dl className="grid gap-x-6 gap-y-2.5 text-small sm:grid-cols-2">
          {[
            ["Resolved IP", result.resolvedIp || "—"],
            ["Location", `${countryFlag(result.location?.country)} ${formatLocation(result.location)}`],
            ["ISP / network", result.network?.org || "—"],
            ["Located via", result.location?.source || "—"],
            ["Online lookup", result.onlineLookup],
            ["Express req.ip", result.expressIp || "—"],
            ...Object.entries(result.headers).map(([name, value]) => [name, value ?? "—"]),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 min-w-0">
              <dt className="text-muted shrink-0">{label}</dt>
              <dd className="font-mono text-xs text-right break-all">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-body">
          If this shows your real city, new visitors will be located correctly. Sessions recorded before the fix only
          stored a proxy IP, so they show an approximate place from the browser timezone.
        </p>
      )}
    </Panel>
  );
}

function AudiencePanel({ audience }) {
  if (!audience) return <SkeletonCard />;

  const { coverage, visitors } = audience;
  const total = coverage.sessions;
  const totalVisitors = visitors.new + visitors.returning;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Located to a city"
          value={`${percent(coverage.withCity, total)}%`}
          hint={`${coverage.withCity} of ${total} sessions · ${percent(coverage.withCountry, total)}% to a country`}
        />
        <KpiTile
          label="Returning visitors"
          value={`${percent(visitors.returning, totalVisitors)}%`}
          hint={`${visitors.returning} returning · ${visitors.new} one-time`}
        />
        <KpiTile
          label="Engagement ratio"
          value={`${coverage.engagementRatio}%`}
          hint="Time on site spent actively viewing"
        />
        <KpiTile
          label="Touch screens"
          value={`${percent(coverage.touchSessions, total)}%`}
          hint={`${coverage.touchSessions} sessions on touch devices`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Devices">
          <Donut
            data={audience.devices.map((row) => ({ label: row.label || UNKNOWN, count: row.count }))}
            colorFor={(row, index) => DEVICE_COLORS[row.label] || SERIES[index] || MUTED}
            totalLabel="sessions"
          />
        </Panel>

        <Panel title="Browsers">
          <ShareBar rows={audience.browsers} />
        </Panel>

        <Panel title="Operating systems">
          <ShareBar rows={audience.os} />
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Countries" subtitle="Sessions by visitor country">
          <RankBars
            items={rankItems(
              audience.countries,
              (code) => (code ? `${countryFlag(code)} ${countryName(code)}` : `🌐 ${UNKNOWN}`),
              total,
            )}
            format={withShare(total)}
          />
        </Panel>

        <Panel title="Cities" subtitle="Where located sessions came from">
          <RankBars
            items={audience.cities.map((row) => ({
              key: `${row.city}-${row.region}-${row.country}`,
              label: `${countryFlag(row.country)} ${[row.city, row.region !== row.city ? row.region : null].filter(Boolean).join(", ")}`,
              value: row.count,
              title: countryName(row.country),
            }))}
            format={withShare(total)}
          />
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Traffic sources" subtitle="Referring site, or Direct">
          <RankBars items={rankItems(audience.sources, (label) => label, total)} format={withShare(total)} />
        </Panel>

        <Panel title="ISPs & networks" subtitle="Who provides the visitor's connection">
          {audience.networks.some((row) => row.label) ? (
            <RankBars
              items={rankItems(
                audience.networks.filter((row) => row.label),
                (label) => label,
                coverage.withNetwork,
              )}
              format={withShare(coverage.withNetwork)}
            />
          ) : (
            <Empty>Network details appear for sessions recorded after the location fix.</Empty>
          )}
        </Panel>
      </section>

      <EngagementTable
        title="Engagement by device"
        subtitle="How effectively each kind of device uses the portfolio"
        rows={audience.deviceEngagement}
      />

      <EngagementTable
        title="Engagement by browser"
        rows={audience.browserEngagement}
        labelFor={(label) => <span className="normal-case">{label || UNKNOWN}</span>}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Screen sizes">
          <RankBars items={rankItems(audience.screens, (label) => label || UNKNOWN, total)} format={withShare(total)} />
        </Panel>

        <Panel title="Languages">
          <RankBars items={rankItems(audience.languages, languageName, total)} format={withShare(total)} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Connection speed">
            <ShareBar rows={audience.connections.map((row) => ({ ...row, label: row.label?.toUpperCase() }))} />
          </Panel>

          <Panel title="Theme preference">
            <ShareBar
              rows={audience.themes.map((row) => ({
                ...row,
                label: row.label ? `${row.label[0].toUpperCase()}${row.label.slice(1)} mode` : null,
              }))}
            />
          </Panel>
        </div>
      </section>

      <GeoCheck />
    </div>
  );
}

export default AudiencePanel;
